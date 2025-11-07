// pipes/multipart-coercion.pipe.ts
import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

type PrimitiveValue = string | number | boolean | null | undefined;

function isJsonLikeString(value: PrimitiveValue): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];
  return (
    (firstChar === "{" && lastChar === "}") ||
    (firstChar === "[" && lastChar === "]")
  );
}

function parseJsonValue(raw: PrimitiveValue, fieldName?: string) {
  if (!isJsonLikeString(raw)) return raw;

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new BadRequestException(
      `${fieldName ? `${fieldName} ` : "payload "}JSON 파싱에 실패했습니다.`,
    );
  }
}

function coerceBoolean(value: PrimitiveValue) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return value;

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  return value;
}

function coerceNumber(value: PrimitiveValue) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return value;
  if (!value.trim()) return value;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}

function deepCoerce(value: any, metadata?: ArgumentMetadata) {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => deepCoerce(item, metadata));
  }

  if (typeof value !== "object") {
    const parsed = parseJsonValue(value, metadata?.data);
    if (parsed !== value) {
      return deepCoerce(parsed, metadata);
    }
    return parsed;
  }

  const booleanKeys = new Set(["is_show_player", "is_show_bracket"]);
  const intKeys = new Set(["master_idx"]);
  const dateKeys = new Set(["start_date", "request_start_date", "request_end_date"]);

  const coerced: Record<string, any> = {};

  Object.entries(value).forEach(([key, raw]) => {
    if (raw === "") {
      coerced[key] = undefined;
      return;
    }

    let currentValue: any = parseJsonValue(raw as PrimitiveValue, key);

    if (booleanKeys.has(key)) {
      currentValue = coerceBoolean(currentValue);
      if (typeof currentValue !== "boolean") {
        throw new BadRequestException(`Invalid boolean for ${key}`);
      }
      coerced[key] = currentValue;
      return;
    }

    if (intKeys.has(key)) {
      currentValue = coerceNumber(currentValue);
      if (typeof currentValue !== "number" || Number.isNaN(currentValue)) {
        throw new BadRequestException(`Invalid number for ${key}`);
      }
      coerced[key] = currentValue;
      return;
    }

    if (dateKeys.has(key)) {
      if (typeof currentValue !== "string") {
        throw new BadRequestException(`Invalid date string for ${key}`);
      }
      coerced[key] = currentValue;
      return;
    }

    if (key === "desc" && value["description"] === undefined) {
      coerced["description"] = currentValue;
      return;
    }

    coerced[key] = deepCoerce(currentValue, metadata);
  });

  return coerced;
}

@Injectable()
export class MultipartCoercionPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value === undefined || value === null) {
      return value;
    }

    const coerced = deepCoerce(value, metadata);

    if (metadata.metatype && typeof metadata.metatype === "function") {
      try {
        // ValidationPipe가 transform 옵션으로 DTO 변환을 수행하더라도
        // 여기서 한 번 더 plain 객체를 반환하여 whitelist 처리에 대비한다.
        return { ...coerced };
      } catch {
        // DTO 변환이 실패하더라도 이미 plain 객체 상태이므로 그대로 반환
        return coerced;
      }
    }

    return coerced;
  }
}
