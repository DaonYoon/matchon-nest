import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from '@/auth/auth.service';

/**
 * 사용자 서비스
 * 사용자 등록, 조회, 수정 등 사용자 관련 비즈니스 로직 처리
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
  ) {}

  /**
   * 새 사용자 등록
   * @param createUserDto 사용자 등록 정보
   * @returns 생성된 사용자 정보 (비밀번호 제외)
   */
  async createUser(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { email, password, ...userData } = createUserDto;

    // 이메일 중복 확인 (이메일이 제공된 경우)
    if (email) {
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
    }

    try {
      // 비밀번호 해시화
      const hashedPassword = await this.authService.hashPassword(password);

      // 사용자 생성
      const user = this.userRepository.create({
        ...userData,
        email,
        password: hashedPassword,
      });

      const savedUser = await this.userRepository.save(user);

      // 비밀번호 제외하고 반환
      const { password: _, ...userWithoutPassword } = savedUser;
      return userWithoutPassword;
    } catch (error) {
      throw new ConflictException('사용자 등록 중 오류가 발생했습니다.');
    }
  }

  /**
   * 사용자 ID로 조회
   * @param idx 사용자 고유번호
   * @returns 사용자 정보 (비밀번호 제외)
   */
  async findUserById(idx: number): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { idx },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * 이메일로 사용자 조회
   * @param email 이메일 주소
   * @returns 사용자 정보 (비밀번호 포함)
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  /**
   * 모든 사용자 조회
   * @returns 사용자 목록 (비밀번호 제외)
   */
  async findAllUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find({
      order: { created_at: 'DESC' },
    });

    return users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
  }

  /**
   * 사용자 정보 수정
   * @param idx 사용자 고유번호
   * @param updateData 수정할 데이터
   * @returns 수정된 사용자 정보 (비밀번호 제외)
   */
  async updateUser(idx: number, updateData: Partial<CreateUserDto>): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { idx },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 이메일 중복 확인 (이메일이 변경되는 경우)
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateData.email },
      });

      if (existingUser) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
    }

    try {
      // 비밀번호가 포함된 경우 해시화
      if (updateData.password) {
        updateData.password = await this.authService.hashPassword(updateData.password);
      }

      // 사용자 정보 업데이트
      Object.assign(user, updateData);
      const updatedUser = await this.userRepository.save(user);

      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error) {
      throw new ConflictException('사용자 정보 수정 중 오류가 발생했습니다.');
    }
  }

  /**
   * 사용자 삭제
   * @param idx 사용자 고유번호
   */
  async deleteUser(idx: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { idx },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    try {
      await this.userRepository.remove(user);
    } catch (error) {
      throw new ConflictException('사용자 삭제 중 오류가 발생했습니다.');
    }
  }
}
