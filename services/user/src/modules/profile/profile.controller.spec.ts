import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ProfileController', () => {
  let profileController: ProfileController;
  let profileService: ProfileService;

  const mockProfileService = {
    createProfile: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfile: jest.fn(),
    searchProfiles: jest.fn(),
    updateStats: jest.fn(),
    updateAchievements: jest.fn(),
    updateRating: jest.fn(),
  };

  const mockUserProfile = {
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
    },
    stats: {
      win_rate: 0.67,
      average_score: 85,
    },
    rating: 4.2,
    totalReviews: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    }).compile();

    profileController = module.get<ProfileController>(ProfileController);
    profileService = module.get<ProfileService>(ProfileService);
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

    it('should create a new profile', async () => {
      mockProfileService.createProfile.mockResolvedValue(mockUserProfile);

      const result = await profileController.createProfile(createProfileDto);

      expect(result).toEqual(mockUserProfile);
      expect(mockProfileService.createProfile).toHaveBeenCalledWith(createProfileDto);
    });

    it('should throw BadRequestException when profile already exists', async () => {
      mockProfileService.createProfile.mockRejectedValue(
        new BadRequestException('Profile already exists'),
      );

      await expect(
        profileController.createProfile(createProfileDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const userId = 'user-id-123';
      mockProfileService.getProfile.mockResolvedValue(mockUserProfile);

      const result = await profileController.getProfile(userId);

      expect(result).toEqual(mockUserProfile);
      expect(mockProfileService.getProfile).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      const userId = 'non-existent-user';
      mockProfileService.getProfile.mockRejectedValue(
        new NotFoundException('Profile not found'),
      );

      await expect(profileController.getProfile(userId)).rejects.toThrow(
        NotFoundException,
      );
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
      
      mockProfileService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await profileController.updateProfile(userId, updateProfileDto);

      expect(result).toEqual(updatedProfile);
      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(
        userId,
        updateProfileDto,
      );
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      const userId = 'non-existent-user';
      mockProfileService.updateProfile.mockRejectedValue(
        new NotFoundException('Profile not found'),
      );

      await expect(
        profileController.updateProfile(userId, updateProfileDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteProfile', () => {
    it('should delete user profile', async () => {
      const userId = 'user-id-123';
      mockProfileService.deleteProfile.mockResolvedValue(undefined);

      await profileController.deleteProfile(userId);

      expect(mockProfileService.deleteProfile).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      const userId = 'non-existent-user';
      mockProfileService.deleteProfile.mockRejectedValue(
        new NotFoundException('Profile not found'),
      );

      await expect(profileController.deleteProfile(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('searchProfiles', () => {
    const searchQuery = {
      skillLevel: 'intermediate',
      city: 'Karachi',
      minRating: '4.0',
      page: '1',
      limit: '10',
    };

    it('should return search results', async () => {
      const expectedResult = {
        profiles: [mockUserProfile],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockProfileService.searchProfiles.mockResolvedValue(expectedResult);

      const result = await profileController.searchProfiles(searchQuery);

      expect(result).toEqual(expectedResult);
      expect(mockProfileService.searchProfiles).toHaveBeenCalledWith({
        skillLevel: 'intermediate',
        city: 'Karachi',
        minRating: 4.0,
        page: 1,
        limit: 10,
      });
    });

    it('should handle empty search results', async () => {
      const emptyResult = {
        profiles: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockProfileService.searchProfiles.mockResolvedValue(emptyResult);

      const result = await profileController.searchProfiles({});

      expect(result).toEqual(emptyResult);
    });
  });

  describe('updateStats', () => {
    const statsDto = {
      matches_played: 50,
      win_rate: 0.72,
      average_score: 88,
    };

    it('should update user stats', async () => {
      const userId = 'user-id-123';
      const updatedProfile = {
        ...mockUserProfile,
        stats: { ...mockUserProfile.stats, ...statsDto },
      };

      mockProfileService.updateStats.mockResolvedValue(updatedProfile);

      const result = await profileController.updateStats(userId, statsDto);

      expect(result).toEqual(updatedProfile);
      expect(mockProfileService.updateStats).toHaveBeenCalledWith(userId, statsDto);
    });
  });

  describe('updateAchievements', () => {
    const achievementsDto = {
      tournaments_won: 3,
      championship_titles: 1,
      monthly_challenges: 5,
    };

    it('should update user achievements', async () => {
      const userId = 'user-id-123';
      const updatedProfile = {
        ...mockUserProfile,
        achievements: { ...mockUserProfile.achievements, ...achievementsDto },
      };

      mockProfileService.updateAchievements.mockResolvedValue(updatedProfile);

      const result = await profileController.updateAchievements(userId, achievementsDto);

      expect(result).toEqual(updatedProfile);
      expect(mockProfileService.updateAchievements).toHaveBeenCalledWith(
        userId,
        achievementsDto,
      );
    });
  });

  describe('updateRating', () => {
    const ratingDto = {
      rating: 4.5,
    };

    it('should update user rating', async () => {
      const userId = 'user-id-123';
      const updatedProfile = {
        ...mockUserProfile,
        rating: ratingDto.rating,
        totalReviews: mockUserProfile.totalReviews + 1,
      };

      mockProfileService.updateRating.mockResolvedValue(updatedProfile);

      const result = await profileController.updateRating(userId, ratingDto);

      expect(result).toEqual(updatedProfile);
      expect(mockProfileService.updateRating).toHaveBeenCalledWith(
        userId,
        ratingDto.rating,
      );
    });

    it('should throw BadRequestException for invalid rating', async () => {
      const userId = 'user-id-123';
      const invalidRatingDto = { rating: 6.0 };

      mockProfileService.updateRating.mockRejectedValue(
        new BadRequestException('Invalid rating value'),
      );

      await expect(
        profileController.updateRating(userId, invalidRatingDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMyProfile', () => {
    it('should return current user profile', async () => {
      const request = {
        user: { id: 'user-id-123' },
      };

      mockProfileService.getProfile.mockResolvedValue(mockUserProfile);

      const result = await profileController.getMyProfile(request);

      expect(result).toEqual(mockUserProfile);
      expect(mockProfileService.getProfile).toHaveBeenCalledWith('user-id-123');
    });
  });

  describe('updateMyProfile', () => {
    const updateDto = {
      bio: 'Updated my bio',
      skillLevel: 'advanced' as const,
    };

    it('should update current user profile', async () => {
      const request = {
        user: { id: 'user-id-123' },
      };

      const updatedProfile = { ...mockUserProfile, ...updateDto };
      mockProfileService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await profileController.updateMyProfile(request, updateDto);

      expect(result).toEqual(updatedProfile);
      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(
        'user-id-123',
        updateDto,
      );
    });
  });
});