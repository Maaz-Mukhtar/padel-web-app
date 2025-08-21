# Implementation Plan - Vertical Slicing Methodology

## 🎯 Implementation Philosophy

### Vertical Slicing Approach

The development follows a **vertical slicing methodology** where each increment delivers complete, end-to-end functionality that provides immediate business value. This approach ensures continuous delivery of working software while maintaining architectural integrity and enabling early user feedback.

### Core Principles

1. **End-to-End Value**: Each slice delivers complete user journey from frontend to database
2. **Minimal Viable Features**: Focus on core functionality before adding complexity
3. **Continuous Delivery**: Deploy working software at the end of each sprint
4. **User-Centric**: Prioritize features based on user value and business impact
5. **Risk Mitigation**: Address highest-risk components early in development
6. **Iterative Refinement**: Improve and expand features based on user feedback

---

## 🏗️ Vertical Slice Architecture

### Slice Definition

Each vertical slice represents a complete user story that cuts through all layers of the application:

```
User Interface (Frontend)
    ↓
API Layer (Backend Services)
    ↓
Business Logic (Domain Services)
    ↓
Data Access (Repository Pattern)
    ↓
Database (Persistent Storage)
```

### Slice Characteristics

- **Independent**: Can be developed and deployed independently
- **Testable**: Complete testing from UI to database
- **Valuable**: Provides immediate business value
- **Demonstrable**: Can be shown to stakeholders
- **Measurable**: Success criteria can be evaluated

---

## 📋 Slice Prioritization Framework

### Priority Matrix

Features are prioritized based on:

1. **Business Value**: Revenue impact and user satisfaction
2. **Technical Risk**: Complexity and uncertainty
3. **User Impact**: Number of users affected
4. **Dependencies**: Dependencies on other features

### Prioritization Scoring

```typescript
interface SlicePriority {
  businessValue: number; // 1-5 scale
  technicalRisk: number; // 1-5 scale
  userImpact: number; // 1-5 scale
  dependencies: number; // 1-5 scale (1 = no dependencies)

  calculateScore(): number {
    return (businessValue * userImpact * dependencies) / technicalRisk;
  }
}
```

---

## 🚀 Phase 1: Foundation Slices (Weeks 1-4)

### Slice 1.1: Authentication System (Week 1)

**Business Value**: Foundation for all user interactions and security
**User Story**: "As a new user, I want to register and login securely so that I can access the platform"

#### Frontend Components

```typescript
// Registration form component
export const RegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  });

  const { mutate: registerUser, isLoading } = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      toast.success('Registration successful! Please verify your email.');
      router.push('/verify-email');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerUser(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField
        label="Email"
        type="email"
        value={formData.email}
        onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
        required
      />
      <InputField
        label="Password"
        type="password"
        value={formData.password}
        onChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
        required
      />
      {/* Additional fields */}
      <Button type="submit" loading={isLoading}>
        Register
      </Button>
    </form>
  );
};
```

#### Backend Implementation

```typescript
// User registration endpoint
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe())
  async register(@Body() registerDto: RegisterUserDto): Promise<AuthResponse> {
    const user = await this.authService.register(registerDto);
    const tokens = await this.authService.generateTokens(user);

    // Send verification email
    await this.authService.sendVerificationEmail(user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginUserDto): Promise<AuthResponse> {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password
    );
    const tokens = await this.authService.generateTokens(user);

    return {
      user: this.authService.transformUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
```

#### Database Schema

```sql
-- Users table with authentication fields
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User sessions for token management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Success Criteria

- ✅ User can register with email and password
- ✅ Email verification flow works
- ✅ User can login and receive JWT tokens
- ✅ Protected routes require authentication
- ✅ Password reset functionality works

### Slice 1.2: User Profile Management (Week 2)

**Business Value**: Personalized user experience and social features foundation
**User Story**: "As a user, I want to manage my profile and connect with other players"

#### Frontend Implementation

```typescript
// Venue listing page
export const VenueListingPage: React.FC = () => {
  const [filters, setFilters] = useState<VenueFilters>({
    city: '',
    search: '',
    priceRange: [0, 5000]
  });

  const { data: venues, isLoading, error } = useQuery({
    queryKey: ['venues', filters],
    queryFn: () => venueService.getVenues(filters),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <VenueFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      {isLoading ? (
        <VenueListingSkeleton />
      ) : error ? (
        <ErrorMessage message="Failed to load venues" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues?.map(venue => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      )}
    </div>
  );
};

// Venue card component
export const VenueCard: React.FC<{ venue: Venue }> = ({ venue }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <img
          src={venue.imageUrl || '/default-venue.jpg'}
          alt={venue.name}
          className="w-full h-48 object-cover"
        />
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{venue.name}</h3>
        <p className="text-gray-600 text-sm mb-2">{venue.address}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <StarIcon className="w-4 h-4 text-yellow-400" />
            <span className="ml-1 text-sm">{venue.rating}</span>
          </div>
          <span className="text-green-600 font-medium">
            From PKR {venue.minPrice}/hr
          </span>
        </div>
        <Button
          className="w-full mt-4"
          onClick={() => router.push(`/venues/${venue.id}`)}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};
```

#### Backend Service

```typescript
// Venue service implementation
@Injectable()
export class VenueService {
  constructor(
    private venueRepository: VenueRepository,
    private cacheService: CacheService
  ) {}

  async getVenues(filters: VenueFiltersDto): Promise<VenueListResponse> {
    const cacheKey = `venues:${JSON.stringify(filters)}`;
    const cached = await this.cacheService.get<VenueListResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    const queryBuilder = this.venueRepository
      .createQueryBuilder('venue')
      .leftJoinAndSelect('venue.courts', 'courts')
      .where('venue.status = :status', { status: 'active' });

    // Apply filters
    if (filters.city) {
      queryBuilder.andWhere('venue.city ILIKE :city', {
        city: `%${filters.city}%`,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(venue.name ILIKE :search OR venue.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.minPrice || filters.maxPrice) {
      queryBuilder.andWhere(
        'courts.base_price BETWEEN :minPrice AND :maxPrice',
        {
          minPrice: filters.minPrice || 0,
          maxPrice: filters.maxPrice || 10000,
        }
      );
    }

    const venues = await queryBuilder
      .orderBy('venue.rating', 'DESC')
      .addOrderBy('venue.created_at', 'DESC')
      .limit(filters.limit || 20)
      .offset(filters.offset || 0)
      .getMany();

    const result = {
      venues: venues.map(venue => this.transformVenue(venue)),
      total: await queryBuilder.getCount(),
      hasMore:
        (filters.offset || 0) + venues.length < (await queryBuilder.getCount()),
    };

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, result, 300);

    return result;
  }

  private transformVenue(venue: any): VenueListItem {
    return {
      id: venue.id,
      name: venue.name,
      address: venue.address,
      city: venue.city,
      rating: venue.rating || 0,
      imageUrl: venue.imageUrl,
      minPrice: Math.min(...venue.courts.map(c => c.basePrice)),
      courtCount: venue.courts.length,
      amenities: venue.amenities || [],
    };
  }
}
```

#### Success Criteria

- ✅ Users can view list of available venues
- ✅ Basic filtering by city and search works
- ✅ Venues display key information (name, rating, price)
- ✅ Pagination handles large venue lists
- ✅ Performance: Page loads within 2 seconds

### Slice 1.3: Simple Booking Creation (Week 2-3)

**Business Value**: Core revenue-generating functionality
**User Story**: "As a user, I want to book a court so that I can secure my playing time"

#### Frontend Booking Flow

```typescript
// Booking creation page
export const BookingCreationPage: React.FC = () => {
  const { venueId } = useParams();
  const [bookingData, setBookingData] = useState<BookingFormData>({
    venueId,
    courtId: '',
    date: '',
    startTime: '',
    endTime: '',
    players: 1
  });

  const { data: venue } = useQuery({
    queryKey: ['venue', venueId],
    queryFn: () => venueService.getVenue(venueId!)
  });

  const { data: availability } = useQuery({
    queryKey: ['availability', venueId, bookingData.date],
    queryFn: () => bookingService.getAvailability(venueId!, bookingData.date),
    enabled: !!bookingData.date
  });

  const { mutate: createBooking, isLoading } = useMutation({
    mutationFn: bookingService.createBooking,
    onSuccess: (booking) => {
      toast.success('Booking created successfully!');
      router.push(`/bookings/${booking.id}/payment`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = () => {
    createBooking(bookingData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Book a Court</h1>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">{venue?.name}</h2>

          <div className="space-y-4">
            <DatePicker
              label="Select Date"
              value={bookingData.date}
              onChange={(date) => setBookingData(prev => ({ ...prev, date }))}
              minDate={new Date()}
              maxDate={addDays(new Date(), 30)}
            />

            {bookingData.date && (
              <CourtSelector
                courts={venue?.courts || []}
                availability={availability}
                selectedCourt={bookingData.courtId}
                onCourtSelect={(courtId) =>
                  setBookingData(prev => ({ ...prev, courtId }))
                }
              />
            )}

            {bookingData.courtId && (
              <TimeSlotSelector
                availability={availability?.courts[bookingData.courtId]}
                selectedTime={{ start: bookingData.startTime, end: bookingData.endTime }}
                onTimeSelect={(start, end) =>
                  setBookingData(prev => ({ ...prev, startTime: start, endTime: end }))
                }
              />
            )}
          </div>
        </CardContent>
      </Card>

      {bookingData.startTime && bookingData.endTime && (
        <BookingSummary
          booking={bookingData}
          venue={venue}
          onConfirm={handleSubmit}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

// Time slot selector component
export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  availability,
  selectedTime,
  onTimeSelect
}) => {
  const timeSlots = generateTimeSlots(availability);

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Select Time</label>
      <div className="grid grid-cols-3 gap-2">
        {timeSlots.map(slot => (
          <Button
            key={`${slot.start}-${slot.end}`}
            variant={
              selectedTime.start === slot.start ? 'primary' :
              slot.available ? 'outline' : 'disabled'
            }
            disabled={!slot.available}
            onClick={() => onTimeSelect(slot.start, slot.end)}
            className="text-sm"
          >
            {slot.start} - {slot.end}
            <br />
            <span className="text-xs">PKR {slot.price}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
```

#### Backend Booking Service

```typescript
// Booking creation service
@Injectable()
export class BookingService {
  constructor(
    private bookingRepository: BookingRepository,
    private venueService: VenueService,
    private availabilityService: AvailabilityService,
    private eventEmitter: EventEmitter2
  ) {}

  async createBooking(createBookingDto: CreateBookingDto): Promise<Booking> {
    // Start database transaction
    return this.bookingRepository.manager.transaction(async manager => {
      // 1. Verify availability with lock
      const isAvailable = await this.availabilityService.checkAndLockSlot(
        createBookingDto.courtId,
        createBookingDto.date,
        createBookingDto.startTime,
        createBookingDto.endTime,
        manager
      );

      if (!isAvailable) {
        throw new BadRequestException('Time slot is no longer available');
      }

      // 2. Calculate pricing
      const pricing = await this.calculateBookingPrice(createBookingDto);

      // 3. Create booking record
      const booking = manager.create(Booking, {
        userId: createBookingDto.userId,
        venueId: createBookingDto.venueId,
        courtId: createBookingDto.courtId,
        bookingDate: createBookingDto.date,
        startTime: createBookingDto.startTime,
        endTime: createBookingDto.endTime,
        totalAmount: pricing.totalAmount,
        commissionAmount: pricing.commissionAmount,
        status: BookingStatus.PENDING,
      });

      const savedBooking = await manager.save(booking);

      // 4. Emit booking created event
      this.eventEmitter.emit('booking.created', {
        bookingId: savedBooking.id,
        userId: savedBooking.userId,
        venueId: savedBooking.venueId,
        amount: savedBooking.totalAmount,
      });

      return savedBooking;
    });
  }

  async getAvailability(
    venueId: string,
    date: string
  ): Promise<AvailabilityResponse> {
    const cacheKey = `availability:${venueId}:${date}`;
    const cached = await this.cacheService.get<AvailabilityResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    const venue = await this.venueService.findById(venueId);
    const courts = venue.courts;
    const availability: AvailabilityResponse = {
      date,
      courts: {},
    };

    for (const court of courts) {
      availability.courts[court.id] = await this.getCourtAvailability(
        court.id,
        date
      );
    }

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, availability, 300);

    return availability;
  }

  private async getCourtAvailability(
    courtId: string,
    date: string
  ): Promise<CourtAvailability> {
    const bookings = await this.bookingRepository.find({
      where: {
        courtId,
        bookingDate: date,
        status: In([BookingStatus.CONFIRMED, BookingStatus.PENDING]),
      },
    });

    const operatingHours = await this.getOperatingHours(courtId, date);
    const availableSlots = this.calculateAvailableSlots(
      operatingHours,
      bookings
    );

    return {
      courtId,
      date,
      operatingHours,
      availableSlots,
      bookedSlots: bookings.map(b => ({
        start: b.startTime,
        end: b.endTime,
        bookingId: b.id,
      })),
    };
  }

  private calculateBookingPrice(bookingData: CreateBookingDto): BookingPricing {
    const duration = this.calculateDuration(
      bookingData.startTime,
      bookingData.endTime
    );

    const basePrice = bookingData.basePrice * duration;
    const commissionRate = 0.075; // 7.5%
    const commissionAmount = basePrice * commissionRate;
    const totalAmount = basePrice;

    return {
      basePrice,
      commissionAmount,
      totalAmount,
      duration,
    };
  }
}
```

#### Database Schema Updates

```sql
-- Bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    venue_id UUID REFERENCES venues(id) NOT NULL,
    court_id UUID REFERENCES courts(id) NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    commission_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_bookings_court_date ON bookings(court_id, booking_date);
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_venue_date ON bookings(venue_id, booking_date);

-- Availability slots table for optimization
CREATE TABLE availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_id UUID REFERENCES courts(id) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    price DECIMAL(10, 2),
    UNIQUE(court_id, date, start_time)
);
```

#### Success Criteria

- ✅ Users can select date, court, and time slot
- ✅ Real-time availability checking prevents double booking
- ✅ Booking creation succeeds with proper validation
- ✅ Price calculation works correctly
- ✅ Concurrency handling prevents race conditions

### Slice 1.4: Basic Payment Processing (Week 3-4)

**Business Value**: Complete revenue cycle with Stripe integration
**User Story**: "As a user, I want to pay for my booking so that I can confirm my reservation"

#### Frontend Payment Integration

```typescript
// Payment page component
export const PaymentPage: React.FC = () => {
  const { bookingId } = useParams();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingService.getBooking(bookingId!)
  });

  const { mutate: processPayment, isLoading } = useMutation({
    mutationFn: paymentService.processPayment,
    onSuccess: (result) => {
      if (result.status === 'succeeded') {
        toast.success('Payment successful!');
        router.push(`/bookings/${bookingId}/confirmation`);
      } else {
        toast.error('Payment failed. Please try again.');
      }
    }
  });

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Complete Payment</h1>

      <BookingSummaryCard booking={booking} />

      <Card className="mt-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Method</h2>

          <PaymentMethodSelector
            selected={paymentMethod}
            onSelect={setPaymentMethod}
          />

          {paymentMethod === 'card' && (
            <StripePaymentForm
              booking={booking}
              onPaymentSuccess={(result) => processPayment(result)}
              isLoading={isLoading}
            />
          )}

          {paymentMethod === 'easypaysa' && (
            <EasyPaysaPaymentForm
              booking={booking}
              onPaymentSuccess={(result) => processPayment(result)}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Stripe payment form
export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  booking,
  onPaymentSuccess,
  isLoading
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState<string>('');

  useEffect(() => {
    // Create payment intent when component mounts
    paymentService.createPaymentIntent(booking.id)
      .then(result => setClientSecret(result.clientSecret));
  }, [booking.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: booking.user.name,
            email: booking.user.email
          }
        }
      }
    );

    if (error) {
      toast.error(error.message);
    } else if (paymentIntent.status === 'succeeded') {
      onPaymentSuccess({
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>

      <Button
        type="submit"
        disabled={!stripe || isLoading}
        loading={isLoading}
        className="w-full"
      >
        Pay PKR {booking?.totalAmount}
      </Button>
    </form>
  );
};
```

#### Backend Payment Service

```typescript
// Payment processing service
@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private paymentRepository: PaymentRepository,
    private bookingService: BookingService,
    private notificationService: NotificationService
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(bookingId: string): Promise<PaymentIntentResponse> {
    const booking = await this.bookingService.findById(bookingId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking is not in pending status');
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount * 100), // Convert to paisa
      currency: 'pkr',
      payment_method_types: ['card'],
      metadata: {
        bookingId: booking.id,
        userId: booking.userId,
        venueId: booking.venueId,
      },
    });

    // Save payment record
    const payment = await this.paymentRepository.save({
      bookingId: booking.id,
      userId: booking.userId,
      amount: booking.totalAmount,
      currency: 'PKR',
      gateway: 'stripe',
      gatewayTransactionId: paymentIntent.id,
      status: 'pending',
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentId: payment.id,
    };
  }

  async handleStripeWebhook(payload: string, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error) {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(
          event.data.object as Stripe.PaymentIntent
        );
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(
          event.data.object as Stripe.PaymentIntent
        );
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSuccess(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    const bookingId = paymentIntent.metadata.bookingId;

    await this.paymentRepository.manager.transaction(async manager => {
      // Update payment status
      await manager.update(
        Payment,
        { gatewayTransactionId: paymentIntent.id },
        {
          status: 'completed',
          processedAt: new Date(),
        }
      );

      // Confirm booking
      await manager.update(
        Booking,
        { id: bookingId },
        {
          status: BookingStatus.CONFIRMED,
          updatedAt: new Date(),
        }
      );
    });

    // Send confirmation notifications
    const booking = await this.bookingService.findById(bookingId);
    await this.notificationService.sendBookingConfirmation(booking);

    // Emit event for analytics
    this.eventEmitter.emit('payment.completed', {
      bookingId,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    });
  }

  private async handlePaymentFailure(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    const bookingId = paymentIntent.metadata.bookingId;

    await this.paymentRepository.update(
      { gatewayTransactionId: paymentIntent.id },
      {
        status: 'failed',
        failureReason: paymentIntent.last_payment_error?.message,
      }
    );

    // Optional: Cancel booking after failed payment
    await this.bookingService.cancelBooking(bookingId, 'Payment failed');
  }
}
```

#### Success Criteria

- ✅ Stripe payment integration works end-to-end
- ✅ Payment confirmation updates booking status
- ✅ Webhook handling processes payment events
- ✅ Failed payments are handled gracefully
- ✅ Users receive payment confirmation

---

## 📅 Phase 2: Enhancement Slices (Weeks 5-8)

### Slice 2.1: Local Payment Integration (Week 5)

**Business Value**: Support for Pakistani payment methods
**User Story**: "As a Pakistani user, I want to pay using EasyPaisa/JazzCash so that I can use familiar payment methods"

#### Implementation Details

- EasyPaisa API integration
- JazzCash payment gateway
- Mobile wallet payment flows
- Local currency optimization

### Slice 2.2: Group Booking System (Week 6)

**Business Value**: Social features increase user engagement
**User Story**: "As a user, I want to invite friends to join my booking so that we can play together"

#### Key Features

- Group booking creation
- Friend invitation system
- Payment splitting options
- Group coordination tools

### Slice 2.3: Mobile App Core Features (Week 7)

**Business Value**: Mobile-first user experience
**User Story**: "As a mobile user, I want a native app experience so that I can book courts on the go"

#### Implementation Focus

- React Native app development
- Core booking flow mobile optimization
- Push notifications setup
- Offline capability basics

### Slice 2.4: Notification System (Week 8)

**Business Value**: User engagement and communication
**User Story**: "As a user, I want to receive booking confirmations and reminders so that I don't miss my sessions"

#### Multi-Channel Notifications

- Email confirmation system
- SMS notifications
- WhatsApp Business integration
- Push notifications

---

## 📅 Phase 3: Scale Slices (Weeks 9-12)

### Slice 3.1: Tournament Management (Week 9)

**Business Value**: Community engagement and revenue diversification
**User Story**: "As a tournament organizer, I want to create and manage padel tournaments so that I can engage the community"

### Slice 3.2: Advanced Search & Filtering (Week 10)

**Business Value**: Improved user experience and venue discovery
**User Story**: "As a user, I want to find venues based on specific criteria so that I can find the perfect court"

### Slice 3.3: Analytics Dashboard (Week 11)

**Business Value**: Business intelligence for venue owners
**User Story**: "As a venue owner, I want to see booking analytics so that I can optimize my business"

### Slice 3.4: Performance Optimization (Week 12)

**Business Value**: Scalability and user experience
**Technical Story**: "As a system, I need to handle high traffic so that users have a fast experience"

---

## 📅 Phase 4: Launch Slices (Weeks 13-14)

### Slice 4.1: Production Deployment (Week 13)

**Business Value**: System reliability and monitoring
**Technical Story**: "As a platform, I need to be production-ready so that users can rely on the service"

### Slice 4.2: Go-to-Market Features (Week 14)

**Business Value**: Market launch and user acquisition
**User Story**: "As a new user, I want to easily discover and start using the platform so that I can begin playing padel"

---

## 🧪 Testing Strategy per Slice

### Testing Pyramid

```
                    /\
                   /  \
                  /E2E \
                 /______\
                /        \
               /Integration\
              /__________\
             /            \
            /     Unit     \
           /________________\
```

### Unit Testing (70% of tests)

```typescript
// Example unit test for booking service
describe('BookingService', () => {
  let service: BookingService;
  let repository: MockType<BookingRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: BookingRepository, useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    repository = module.get(BookingRepository);
  });

  describe('createBooking', () => {
    it('should create booking when slot is available', async () => {
      // Arrange
      const createBookingDto = {
        userId: 'user-id',
        courtId: 'court-id',
        date: '2024-03-15',
        startTime: '10:00',
        endTime: '11:00',
      };

      repository.save.mockResolvedValue({
        id: 'booking-id',
        ...createBookingDto,
      });

      // Act
      const result = await service.createBooking(createBookingDto);

      // Assert
      expect(result.id).toBe('booking-id');
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining(createBookingDto)
      );
    });

    it('should throw error when slot is not available', async () => {
      // Arrange
      const createBookingDto = {
        /* booking data */
      };
      jest.spyOn(service, 'checkAvailability').mockResolvedValue(false);

      // Act & Assert
      await expect(service.createBooking(createBookingDto)).rejects.toThrow(
        'Time slot is not available'
      );
    });
  });
});
```

### Integration Testing (25% of tests)

```typescript
// Example integration test
describe('Booking API Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  it('/bookings (POST) should create booking', async () => {
    // Arrange
    const user = await prisma.user.create({ data: testUserData });
    const venue = await prisma.venue.create({ data: testVenueData });
    const bookingData = {
      /* booking data */
    };

    // Act
    const response = await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send(bookingData)
      .expect(201);

    // Assert
    expect(response.body.id).toBeDefined();
    expect(response.body.status).toBe('pending');

    const booking = await prisma.booking.findUnique({
      where: { id: response.body.id },
    });
    expect(booking).toBeTruthy();
  });
});
```

### End-to-End Testing (5% of tests)

```typescript
// Example E2E test with Playwright
test('complete booking flow', async ({ page }) => {
  // User registration and login
  await page.goto('/register');
  await page.fill('[data-testid=email]', 'test@example.com');
  await page.fill('[data-testid=password]', 'password123');
  await page.click('[data-testid=register-button]');

  // Navigate to venues
  await page.click('[data-testid=venues-link]');
  await expect(page.locator('[data-testid=venue-card]')).toHaveCount(3);

  // Select venue and create booking
  await page.click('[data-testid=venue-card]:first-child');
  await page.click('[data-testid=book-now-button]');

  // Fill booking form
  await page.fill('[data-testid=date-picker]', '2024-03-15');
  await page.click('[data-testid=time-slot-10-00]');
  await page.click('[data-testid=confirm-booking]');

  // Complete payment
  await page.fill('[data-testid=card-number]', '4242424242424242');
  await page.fill('[data-testid=card-expiry]', '12/25');
  await page.fill('[data-testid=card-cvc]', '123');
  await page.click('[data-testid=pay-button]');

  // Verify booking confirmation
  await expect(
    page.locator('[data-testid=booking-confirmation]')
  ).toBeVisible();
  await expect(page.locator('[data-testid=booking-id]')).toHaveText(/BK-\d+/);
});
```

---

## 🚀 Deployment Strategy per Slice

### Continuous Deployment Pipeline

```yaml
# Each slice follows this deployment pipeline
name: Slice Deployment Pipeline

on:
  push:
    branches: [feature/slice-*]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          kubectl apply -f k8s/staging/
          kubectl rollout status deployment/app -n staging

  smoke-tests:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - name: Run smoke tests
        run: npm run test:smoke

  deploy-production:
    needs: smoke-tests
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          kubectl apply -f k8s/production/
          kubectl rollout status deployment/app -n production
```

### Feature Flags per Slice

```typescript
// Feature flag service for gradual rollout
@Injectable()
export class FeatureFlagService {
  async isFeatureEnabled(feature: string, userId?: string): Promise<boolean> {
    const flag = await this.getFeatureFlag(feature);

    if (!flag || !flag.enabled) {
      return false;
    }

    // Percentage rollout
    if (flag.rolloutPercentage < 100) {
      const hash = this.getUserHash(userId || 'anonymous');
      return hash % 100 < flag.rolloutPercentage;
    }

    return true;
  }

  private getUserHash(userId: string): number {
    return userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }
}

// Usage in components
export const BookingPage: React.FC = () => {
  const { data: isGroupBookingEnabled } = useQuery({
    queryKey: ['feature-flag', 'group-booking'],
    queryFn: () => featureFlagService.isFeatureEnabled('group-booking')
  });

  return (
    <div>
      {/* Standard booking form */}
      <BookingForm />

      {/* Group booking features (Slice 2.2) */}
      {isGroupBookingEnabled && <GroupBookingOptions />}
    </div>
  );
};
```

---

## 📊 Success Metrics per Slice

### Slice-Level KPIs

Each slice includes specific success criteria:

```typescript
interface SliceMetrics {
  functionalMetrics: {
    featureAdoption: number; // % users using the feature
    completionRate: number; // % successful completions
    errorRate: number; // % of failed attempts
  };

  performanceMetrics: {
    responseTime: number; // Average response time (ms)
    throughput: number; // Requests per second
    availability: number; // Uptime percentage
  };

  businessMetrics: {
    conversionRate: number; // % users converting
    revenueImpact: number; // Revenue attributed to slice
    userSatisfaction: number; // User rating for feature
  };
}
```

### Monitoring Dashboard

```typescript
// Slice monitoring service
@Injectable()
export class SliceMonitoringService {
  async trackSliceMetrics(
    sliceName: string,
    metrics: SliceMetrics
  ): Promise<void> {
    // Send metrics to monitoring system
    await this.metricsService.recordMetrics(sliceName, metrics);

    // Check if metrics meet success criteria
    const criteria = await this.getSuccessCriteria(sliceName);
    const meetsRequirements = this.evaluateMetrics(metrics, criteria);

    if (!meetsRequirements) {
      await this.alertingService.sendAlert({
        severity: 'warning',
        message: `Slice ${sliceName} not meeting success criteria`,
        metrics,
      });
    }
  }
}
```

---

_This implementation plan ensures each vertical slice delivers complete, testable, and valuable functionality while maintaining architectural integrity and enabling continuous delivery of working software throughout the 14-week development timeline._
