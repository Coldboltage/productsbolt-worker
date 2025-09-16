// Generic Money type
export interface Money {
  convertedFromCurrency?: string;
  convertedFromValue?: string;
  currency: string;
  value: string;
}

// Generic Image type
export interface Image {
  height: number;
  width: number;
  imageUrl: string;
}

// Addon service
export interface AddonService {
  selection: 'OPTIONAL' | 'REQUIRED';
  serviceFee: Money;
  serviceId: string;
  serviceType: 'AUTHENTICITY_GUARANTEE';
}

// Coupon
export interface Coupon {
  constraint: {
    expirationDate: string;
  };
  discountAmount: Money;
  discountType: 'ITEM_PRICE';
  message: string;
  redemptionCode: string;
  termsWebUrl: string;
}

// Condition descriptors
export interface ConditionDescriptor {
  name: string;
  values: { additionalInfo?: string[]; content: string }[];
}

// Availability
export interface EstimatedAvailability {
  availabilityThreshold: number;
  availabilityThresholdType: 'MORE_THAN';
  deliveryOptions: string[];
  estimatedAvailabilityStatus: 'IN_STOCK' | 'LIMITED_STOCK' | 'OUT_OF_STOCK';
  estimatedAvailableQuantity?: number;
  estimatedRemainingQuantity?: number;
  estimatedSoldQuantity?: number;
}

// Location
export interface ItemLocation {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  country: string;
  county?: string;
  postalCode?: string;
  stateOrProvince?: string;
}

// Seller
export interface Seller {
  feedbackPercentage: string;
  feedbackScore: number;
  sellerAccountType?: string;
  userId: string;
  username: string;
}

// Shipping option
export interface ShippingOption {
  additionalShippingCostPerUnit?: Money;
  cutOffDateUsedForEstimate?: string;
  fulfilledThrough?: 'GLOBAL_SHIPPING' | 'INTERNATIONAL_SHIPPING';
  guaranteedDelivery?: boolean;
  importCharges?: Money;
  maxEstimatedDeliveryDate?: string;
  minEstimatedDeliveryDate?: string;
  quantityUsedForEstimate?: number;
  shippingCarrierCode?: string;
  shippingCost: Money;
  shippingCostType?: string;
  shippingServiceCode?: string;
}

// Main Item export interface
export interface EbayItem {
  additionalImages?: Image[];
  addonServices?: AddonService[];
  adultOnly?: boolean;
  ageGroup?: string;
  authenticityGuarantee?: { description: string; termsWebUrl: string };
  authenticityVerification?: { description: string; termsWebUrl: string };
  availableCoupons?: Coupon[];
  bidCount?: number;
  brand?: string;
  buyingOptions?: string[];
  categoryId: string;
  categoryPath?: string;
  color?: string;
  condition?: string;
  conditionDescription?: string;
  conditionDescriptors?: ConditionDescriptor[];
  conditionId?: string;
  currentBidPrice?: Money;
  description?: string;
  ecoParticipationFee?: Money;
  eligibleForInlineCheckout?: boolean;
  enabledForGuestCheckout?: boolean;
  energyEfficiencyClass?: string;
  epid?: string;
  estimatedAvailabilities?: EstimatedAvailability[];
  gender?: string;
  gtin?: string;
  image?: Image;
  immediatePay?: boolean;
  inferredEpid?: string;
  itemAffiliateWebUrl?: string;
  itemCreationDate: string;
  itemEndDate?: string;
  itemId: string;
  itemLocation?: ItemLocation;
  itemWebUrl: string;
  legacyItemId?: string;
  listingMarketplaceId: string;
  lotSize?: number;
  manufacturer?: { companyName?: string; addressLine1?: string };
  marketingPrice?: { originalPrice: Money; discountAmount?: Money };
  material?: string;
  minimumPriceToBid?: Money;
  mpn?: string;
  pattern?: string;
  paymentMethods?: any[]; // simplify unless you need detail
  price: Money;
  priceDisplayCondition?: 'ONLY_SHOW_WHEN_ADDED_IN_CART' | 'ONLY_SHOW_ON_REQUEST' | 'ALWAYS_SHOW';
  primaryItemGroup?: { itemGroupId: string; itemGroupTitle: string };
  primaryProductReviewRating?: { averageRating: string; reviewCount: number };
  priorityListing?: boolean;
  product?: { title: string; brand?: string; description?: string };
  productFicheWebUrl?: string;
  qualifiedPrograms?: string[];
  quantityLimitPerBuyer?: number;
  reservePriceMet?: boolean;
  returnTerms?: {
    returnsAccepted: boolean;
    refundMethod?: 'MONEY_BACK' | 'MERCHANDISE_CREDIT';
  };
  seller: Seller;
  sellerItemRevision?: string;
  shippingOptions?: ShippingOption[];
  shortDescription?: string;
  size?: string;
  sizeSystem?: string;
  sizeType?: string;
  subtitle?: string;
  taxes?: { taxPercentage: string; taxType: string }[];
  title: string;
  topRatedBuyingExperience?: boolean;
  unitPrice?: Money;
  unitPricingMeasure?: string;
  watchCount?: number;
}
