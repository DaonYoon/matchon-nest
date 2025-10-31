import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

  constructor(private configService: ConfigService) {
    const accessKey = this.configService.get<string>('SAVE_ACCESS_KEY');
    const secretKey = this.configService.get<string>('HIDE_ACCESS_KEY');
    this.region = this.configService.get<string>('AWS_S3_REGION', 'ap-northeast-2');
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET', 'matchons3');

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
      const key = `${folderPath}/${uniqueFileName}`;

      // S3에 업로드
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      });

      await this.s3Client.send(command);

      // S3 URL 반환
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      return url;
    } catch (error) {
      this.logger.error(`S3 업로드 실패: ${error.message}`);
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
}

