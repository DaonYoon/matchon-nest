import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';

/**
 * AWS S3 파일 업로드 서비스
 */
@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly isConfigured: boolean;
  private readonly useObjectAcl: boolean;
  private readonly publicBaseUrl: string | null;

  constructor(private configService: ConfigService) {
    const accessKey = this.configService.get<string>('AWS_CLIENT_KEY');
    const secretKey = this.configService.get<string>('AWS_SECRET_KEY');
    this.region = this.configService.get<string>('AWS_S3_REGION', 'ap-northeast-2');
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET', 'matchons3');

    const useAclConfig = this.configService.get<string>('AWS_S3_USE_OBJECT_ACL', 'false');
    this.useObjectAcl = this.parseBooleanConfig(useAclConfig);

    const publicBaseUrl = this.configService.get<string>('AWS_S3_PUBLIC_BASE_URL');
    this.publicBaseUrl = publicBaseUrl ? publicBaseUrl.replace(/\/$/, '') : null;

    if (!accessKey || !secretKey) {
      this.logger.warn('AWS S3 자격 증명이 설정되지 않았습니다. S3 업로드 기능이 작동하지 않습니다.');
      this.isConfigured = false;
    } else {
      this.isConfigured = true;
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
      });
      this.logger.log('AWS S3 클라이언트가 초기화되었습니다.');
      if (!this.useObjectAcl) {
        this.logger.warn('S3 버킷이 ACL을 허용하지 않는 구성으로 판단되어 `ACL` 헤더 없이 업로드합니다.');
        this.logger.warn('퍼블릭 접근이 필요한 경우 사전에 버킷 정책 또는 CloudFront를 통해 접근 권한을 허용해야 합니다.');
      }
    }
  }

  /**
   * 파일을 S3에 업로드
   * @param file 업로드할 파일
   * @param folderPath S3 폴더 경로 (예: 'contest_thumbnail/1')
   * @returns S3 URL
   */
  async uploadFile(file: Express.Multer.File, folderPath: string): Promise<string> {
    if (!this.isConfigured || !this.s3Client) {
      throw new BadRequestException('AWS S3 자격 증명이 설정되지 않았습니다.');
    }

    try {
      this.validateImageFile(file);

      // 고유한 파일명 생성
      const fileExtension = file.originalname.split('.').pop() || 'jpg';
      const uniqueFileName = `${randomBytes(16).toString('hex')}-${Date.now()}.${fileExtension}`;
      const normalizedFolder = folderPath
        ? folderPath.replace(/^\/+/, '')
            .replace(/\/+$/, '')
        : '';

      const key = normalizedFolder
        ? `${normalizedFolder}/${uniqueFileName}`
        : uniqueFileName;

      // S3에 업로드
      const putParams: PutObjectCommandInput = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      if (this.useObjectAcl) {
        putParams.ACL = 'public-read';
      }

      const command = new PutObjectCommand(putParams);

      await this.s3Client.send(command);

      // S3 URL 반환 (커스텀 도메인 우선)
      const url = this.publicBaseUrl
        ? `${this.publicBaseUrl}/${key}`
        : `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      return url;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`S3 업로드 실패: ${message}`);

      if (message.includes('The bucket does not allow ACLs')) {
        throw new BadRequestException('S3 버킷이 ACL을 허용하지 않아 업로드가 거부되었습니다. 버킷 정책을 수정하거나 `AWS_S3_USE_OBJECT_ACL=false`로 설정하십시오.');
      }

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('파일 업로드에 실패했습니다.');
    }
  }

  /**
   * 이미지 파일 검증
   * @param file 검증할 파일
   */
  validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    // 파일 타입 검증
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('지원하지 않는 이미지 형식입니다. JPEG, PNG, GIF, WEBP만 지원합니다.');
    }

    // 파일 크기 검증 (최대 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('파일 크기는 5MB를 초과할 수 없습니다.');
    }
  }

  /**
   * 환경변수 Boolean 파싱 유틸리티
   */
  private parseBooleanConfig(value?: string | null): boolean {
    if (value === undefined || value === null) return false;
    const normalized = value.trim().toLowerCase();
    return ['1', 'true', 'yes', 'y'].includes(normalized);
  }
}

