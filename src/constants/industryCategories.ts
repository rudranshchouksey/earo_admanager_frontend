export const INDUSTRY_CATEGORIES = {
  RETAIL: {
    name: "Retail",
    industries: [
      "Fashion & Apparel",
      "Electronics",
      "Home & Garden",
      "Sporting Goods",
      "Books & Stationery",
      "Toys & Games",
      "Jewellery & Accessories",
      "Department Stores",
      "Supermarkets",
    ],
  },
  FOOD_BEVERAGE: {
    name: "Food & Beverage",
    industries: [
      "Restaurants & QSR",
      "Food Delivery",
      "Packaged Foods",
      "Beverages (Non-Alcoholic)",
      "Beverages (Alcoholic)",
      "Coffee & Tea",
      "Health Foods & Supplements",
      "Catering",
    ],
  },
  BEAUTY_PERSONALCARE: {
    name: "Beauty & Personal Care",
    industries: [
      "Skincare",
      "Haircare",
      "Cosmetics & Makeup",
      "Fragrance",
      "Personal Hygiene",
      "Salons & Spas",
    ],
  },
  HOME_LIVING: {
    name: "Home & Living",
    industries: [
      "Furniture",
      "Home Appliances",
      "Home Décor",
      "Cleaning Products",
      "Home Improvement",
      "Kitchenware",
    ],
  },
  TECH: {
    name: "Technology",
    industries: [
      "Consumer Electronics",
      "Software & SaaS",
      "Mobile Apps",
      "Cybersecurity",
      "AI & Machine Learning",
      "Gaming",
      "Cloud Services",
      "E-commerce Platforms",
    ],
  },
  TELE_COMMUNICATIONS: {
    name: "Telecommunications",
    industries: [
      "Mobile Operators",
      "Internet Providers",
      "TV & Streaming Services",
      "Business Communications",
      "Satellite & Cable",
    ],
  },
  FINANCE: {
    name: "Financial Services",
    industries: [
      "Banking & Credit",
      "Insurance",
      "Investment & Wealth",
      "Fintech & Payments",
      "Cryptocurrency",
      "Mortgages & Loans",
      "Accounting & Tax",
    ],
  },
  PROFESSIONAL_SERVICES: {
    name: "Professional Services",
    industries: [
      "Legal",
      "Consulting & Strategy",
      "HR & Recruitment",
      "Marketing & Advertising",
      "Architecture & Design",
      "Research & Analytics",
    ],
  },
  HEALTH_WELLNESS: {
    name: "Health & Wellness",
    industries: [
      "Hospitals & Clinics",
      "Pharmaceuticals",
      "Fitness & Gyms",
      "Mental Health",
      "Dental & Optical",
      "Nutrition & Supplements",
      "Medical Devices",
      "Health Insurance",
    ],
  },
  EDUCATION: {
    name: "Education",
    industries: [
      "Universities & Colleges",
      "K-12 Schools",
      "E-Learning Platforms",
      "Tutoring & Test Prep",
      "Professional Training",
      "Language Learning",
      "EdTech",
    ],
  },
  SPORTS_FITNESS: {
    name: "Sports & Fitness",
    industries: [
      "Sports Brands",
      "Gyms & Studios",
      "Outdoor & Adventure",
      "Sports Events & Leagues",
      "Esports",
      "Wellness Apps",
    ],
  },
  TRAVEL_HOSPITALITY: {
    name: "Travel & Hospitality",
    industries: [
      "Airlines",
      "Hotels & Resorts",
      "Travel Agencies & OTAs",
      "Cruises",
      "Car Rental",
      "Tourism Boards",
      "Experiences & Tours",
    ],
  },
  AUTOMOTIVE: {
    name: "Automotive",
    industries: [
      "Car Manufacturers",
      "Car Dealerships",
      "Electric Vehicles",
      "Auto Parts & Accessories",
      "Ride-Hailing & Mobility",
      "Fleet & Leasing",
      "Car Insurance",
    ],
  },
  REAL_ESTATE: {
    name: "Real Estate",
    industries: [
      "Residential Sales",
      "Residential Rentals",
      "Commercial Property",
      "Property Development",
      "Property Management",
      "Real Estate Tech",
    ],
  },
  LOGISTICS_TRANSPORT: {
    name: "Logistics & Transport",
    industries: [
      "Courier & Delivery",
      "Freight & Shipping",
      "Warehousing",
      "Supply Chain Tech",
      "Public Transport",
    ],
  },
  ENTERTAINMENT_MEDIA: {
    name: "Entertainment & Media",
    industries: [
      "Streaming & Video",
      "Music & Podcasts",
      "Gaming",
      "Live Events & Concerts",
      "News & Publishing",
      "Film & TV",
      "Social Media Platforms",
    ],
  },
  ENERGY_UTILITIES: {
    name: "Energy & Utilities",
    industries: [
      "Renewable Energy",
      "Oil & Gas",
      "Electricity Providers",
      "Water & Waste",
      "Smart Home Energy",
      "Solar & Wind",
    ],
  },
  GOVERNMENT_NON_PROFIT: {
    name: "Government & Non-Profit",
    industries: [
      "Public Sector Campaigns",
      "NGOs & Charities",
      "Health Awareness",
      "Tourism Promotion",
      "Political Campaigns",
      "Community Initiatives",
    ],
  },
} as const;

export type IndustryCategoryKey = keyof typeof INDUSTRY_CATEGORIES;

export function findCategoryForIndustry(value: string): IndustryCategoryKey | undefined {
  if (value in INDUSTRY_CATEGORIES) {
    return value as IndustryCategoryKey;
  }
  return (Object.entries(INDUSTRY_CATEGORIES) as [IndustryCategoryKey, (typeof INDUSTRY_CATEGORIES)[IndustryCategoryKey]][]).find(
    ([, cat]) => (cat.industries as readonly string[]).includes(value),
  )?.[0];
}

export const DEFAULT_INDUSTRY_CATEGORY: IndustryCategoryKey = "RETAIL";
export const DEFAULT_SUB_INDUSTRY = INDUSTRY_CATEGORIES.RETAIL.industries[0];
