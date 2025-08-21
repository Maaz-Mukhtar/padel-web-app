import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileService } from './profile.service';
import { UserProfile } from '../../entities/user-profile.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ProfileService', () => {
  let profileService: ProfileService;
  let _userProfileRepository: Repository<UserProfile>;

  const mockUserProfile: UserProfile = {
    id: 'profile-id-123',
    userId: 'user-id-123',
    bio: 'Passionate padel player from Karachi',
    skillLevel: 'intermediate',
    playFrequency: 'weekly',
    preferredPlayTime: 'evening',
    profilePictureUrl: 'https://example.com/profile.jpg',
    achievements: {
      tournaments_won: 2,
      matches_played: 45,
      favorite_venue: 'Karachi Padel Club',
    },
    stats: {
      win_rate: 0.67,
      average_score: 85,
      total_points: 1250,
    },
    rating: 4.2,
    totalReviews: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserProfileRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getRepositoryToken(UserProfile),
          useValue: mockUserProfileRepository,
        },
      ],
    }).compile();

    profileService = module.get<ProfileService>(ProfileService);
    _userProfileRepository = module.get<Repository<UserProfile>>(
      getRepositoryToken(UserProfile)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProfile', () => {
    const createProfileDto = {
      userId: 'user-id-123',
      bio: 'New padel player from Lahore',
      skillLevel: 'beginner' as const,
      playFrequency: 'occasionally',
      preferredPlayTime: 'morning',
    };

    it('should create a new user profile', async () => {
      mockUserProfileRepository.findOne.mockResolvedValue(null);
      mockUserProfileRepository.create.mockReturnValue(mockUserProfile);
      mockUserProfileRepository.save.mockResolvedValue(mockUserProfile);

      const result = await profileService.createProfile(createProfileDto);

      expect(result).toEqual(mockUserProfile);
      expect(mockUserProfileRepository.findOne).toHaveBeenCalledWith({
        where: { userId: createProfileDto.userId },
      });
      expect(mockUserProfileRepository.create).toHaveBeenCalledWith(
        createProfileDto
      );
      expect(mockUserProfileRepository.save).toHaveBeenCalledWith(
        mockUserProfile
      );
    });

    it('should throw BadRequestException if profile already exists', async () => {
      mockUserProfileRepository.findOne.mockResolvedValue(mockUserProfile);

      await expect(
        profileService.createProfile(createProfileDto)
      ).rejects.toThrow(BadRequestException);
      expect(mockUserProfileRepository.findOne).toHaveBeenCalledWith({
        where: { userId: createProfileDto.userId },
      });
      expect(mockUserProfileRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return user profile by userId', async () => {
      const userId = 'user-id-123';
      mockUserProfileRepository.findOne.mockResolvedValue(mockUserProfile);

      const result = await profileService.getProfile(userId);

      expect(result).toEqual(mockUserProfile);
      expect(mockUserProfileRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      const userId = 'non-existent-user';
      mockUserProfileRepository.findOne.mockResolvedValue(null);

      await expect(profileService.getProfile(userId)).rejects.toThrow(
        NotFoundException
      );
      expect(mockUserProfileRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('updateProfile', () => {
    const updateProfileDto = {
      bio: 'Updated bio - Advanced padel player',
      skillLevel: 'advanced' as const,
      preferredPlayTime: 'afternoon',
    };

    it('should update user profile', async () => {
      const userId = 'user-id-123';
      const updatedProfile = { ...mockUserProfile, ...updateProfileDto };

      mockUserProfileRepository.findOne.mockResolvedValue(mockUserProfile);
      mockUserProfileRepository.update.mockResolvedValue({ affected: 1 });
      mockUserProfileRepository.findOne.mockResolvedValueOnce(updatedProfile);

      const result = await profileService.updateProfile(
        userId,
        updateProfileDto
      );

      expect(result).toEqual(updatedProfile);
      expect(mockUserProfileRepository.update).toHaveBeenCalledWith(
        { userId },
        updateProfileDto
      );
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      const userId = 'non-existent-user';
      mockUserProfileRepository.findOne.mockResolvedValue(null);

      await expect(
        profileService.updateProfile(userId, updateProfileDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteProfile', () => {
    it('should delete user profile', async () => {
      const userId = 'user-id-123';
      mockUserProfileRepository.findOne.mockResolvedValue(mockUserProfile);
      mockUserProfileRepository.delete.mockResolvedValue({ affected: 1 });

      await profileService.deleteProfile(userId);

      expect(mockUserProfileRepository.delete).toHaveBeenCalledWith({ userId });
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      const userId = 'non-existent-user';
      mockUserProfileRepository.findOne.mockResolvedValue(null);

      await expect(profileService.deleteProfile(userId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('searchProfiles', () => {
    const searchFilters = {
      skillLevel: 'intermediate',
      city: 'Karachi',
      minRating: 4.0,
    };

    it('should return profiles matching search criteria', async () => {
      const mockProfiles = [mockUserProfile];
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockProfiles),
        getCount: jest.fn().mockResolvedValue(1),
      };

      mockUserProfileRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder
      );

      const result = await profileService.searchProfiles(searchFilters);

      expect(result).toEqual({
        profiles: mockProfiles,
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(mockUserProfileRepository.createQueryBuilder).toHaveBeenCalledWith(
        'profile'
      );
    });

    it('should handle pagination parameters', async () => {
      const paginationFilters = {
        ...searchFilters,
        page: 2,
        limit: 5,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0),
      };

      mockUserProfileRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder
      );

      await profileService.searchProfiles(paginationFilters);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(5); // (page - 1) * limit
    });
  });

  describe('updateStats', () => {
    const userId = 'user-id-123';
    const newStats = {
      matches_played: 50,
      win_rate: 0.72,
      average_score: 88,
    };

    it('should update user stats', async () => {
      mockUserProfileRepository.findOne.mockResolvedValue(mockUserProfile);
      const updatedProfile = {
        ...mockUserProfile,
        stats: { ...mockUserProfile.stats, ...newStats },
      };
      mockUserProfileRepository.save.mockResolvedValue(updatedProfile);

      const result = await profileService.updateStats(userId, newStats);

      expect(result).toEqual(updatedProfile);
      expect(mockUserProfileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          stats: expect.objectContaining(newStats),
        })
      );
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      mockUserProfileRepository.findOne.mockResolvedValue(null);

      await expect(
        profileService.updateStats(userId, newStats)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAchievements', () => {
    const userId = 'user-id-123';
    const newAchievements = {
      tournaments_won: 3,
      championship_titles: 1,
      monthly_challenges: 5,
    };

    it('should update user achievements', async () => {
      mockUserProfileRepository.findOne.mockResolvedValue(mockUserProfile);
      const updatedProfile = {
        ...mockUserProfile,
        achievements: { ...mockUserProfile.achievements, ...newAchievements },
      };
      mockUserProfileRepository.save.mockResolvedValue(updatedProfile);

      const result = await profileService.updateAchievements(
        userId,
        newAchievements
      );

      expect(result).toEqual(updatedProfile);
      expect(mockUserProfileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          achievements: expect.objectContaining(newAchievements),
        })
      );
    });
  });

  describe('updateRating', () => {
    const userId = 'user-id-123';
    const newRating = 4.5;

    it('should update user rating and total reviews', async () => {
      mockUserProfileRepository.findOne.mockResolvedValue(mockUserProfile);
      const updatedProfile = {
        ...mockUserProfile,
        rating: newRating,
        totalReviews: mockUserProfile.totalReviews + 1,
      };
      mockUserProfileRepository.save.mockResolvedValue(updatedProfile);

      const result = await profileService.updateRating(userId, newRating);

      expect(result).toEqual(updatedProfile);
      expect(mockUserProfileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: newRating,
          totalReviews: mockUserProfile.totalReviews + 1,
        })
      );
    });

    it('should throw BadRequestException for invalid rating', async () => {
      const invalidRating = 6.0; // Rating should be between 0-5

      await expect(
        profileService.updateRating(userId, invalidRating)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
