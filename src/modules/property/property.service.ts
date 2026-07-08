// =============================================
// 1. প্রপার্টি ক্রিয়েট (Landlord)

import { prisma } from "../../lib/prisma.js";

// =============================================
const createLandlordProperties = async (landlordId: string, payload: any) => {
  const {
    title,
    description,
    images,
    price,
    location,
    categoryId,
    categoryName,
    bedrooms,
    bathrooms,
    size,
    amenities,
    availability,
  } = payload;

  let finalCategoryId = categoryId;

  if (!categoryId && categoryName) {
    const category = await prisma.category.findFirst({
      where: {
        name: {
          equals: categoryName,
          mode: "insensitive",
        },
      },
    });

    if (!category) {
      throw new Error(
        `Category "${categoryName}" not found. Please create the category first.`,
      );
    }

    finalCategoryId = category.id;
  }

  if (!finalCategoryId) {
    throw new Error("Category ID or Category Name is required");
  }

  const property = await prisma.property.create({
    data: {
      title,
      description,
      images: images || [],
      price: parseFloat(price),
      location,
      landlordId: landlordId,
      categoryId: finalCategoryId,
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),
      size: size ? parseFloat(size) : null,
      amenities: amenities || [],
      availability: availability || "AVAILABLE",
    },
    include: {
      category: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return property;
};

// =============================================
// 2. সব প্রপার্টি (Public)
// =============================================
const getAllProperties = async (query: any) => {
  const {
    category,
    categoryName,
    categoryId,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    minSize,
    maxSize,
    availability,
    search,
    landlordId,
    sortBy = "createdAt",
    sortOrder = "desc",
    limit = 10,
    page = 1,
  } = query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = {};

  if (categoryId) {
    where.categoryId = categoryId;
  } else if (category || categoryName) {
    const categorySearch = category || categoryName;
    where.category = {
      name: {
        contains: categorySearch,
        mode: "insensitive",
      },
    };
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  if (bedrooms) where.bedrooms = parseInt(bedrooms);
  if (bathrooms) where.bathrooms = parseInt(bathrooms);

  if (minSize || maxSize) {
    where.size = {};
    if (minSize) where.size.gte = parseFloat(minSize);
    if (maxSize) where.size.lte = parseFloat(maxSize);
  }

  if (availability) where.availability = availability;
  if (landlordId) where.landlordId = landlordId;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
        reviews: {
          select: {
            rating: true,
            comment: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        rentalRequests: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.property.count({ where }),
  ]);

  const propertiesWithRating = properties.map((property: any) => {
    const reviews = property.reviews || [];
    const totalRating = reviews.reduce(
      (sum: number, r: any) => sum + r.rating,
      0,
    );
    const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return {
      id: property.id,
      title: property.title,
      description: property.description,
      images: property.images,
      price: property.price,
      location: property.location,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      size: property.size,
      amenities: property.amenities,
      availability: property.availability,
      category: property.category,
      landlord: {
        id: property.user.id,
        name: property.user.name,
        email: property.user.email,
        phone: property.user.phone,
        role: property.user.role,
        status: property.user.status,
      },
      averageRating: Number(avgRating.toFixed(1)),
      reviewCount: reviews.length,
      rentalRequestCount: property.rentalRequests.length,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };
  });

  return {
    data: propertiesWithRating,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

// =============================================
// 3. সিঙ্গেল প্রপার্টি
// =============================================
const getSingleProperty = async (propertyId: string) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      category: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          address: true,
          createdAt: true,
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      rentalRequests: {
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          landlord: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!property) {
    throw new Error("Property not found");
  }

  const reviews = property.reviews || [];
  const totalRating = reviews.reduce(
    (sum: number, r: any) => sum + r.rating,
    0,
  );
  const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

  const ratingDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  reviews.forEach((review: any) => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    }
  });

  return {
    id: property.id,
    title: property.title,
    description: property.description,
    images: property.images,
    price: property.price,
    location: property.location,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    size: property.size,
    amenities: property.amenities,
    availability: property.availability,
    category: property.category,
    landlord: property.user,
    reviews: property.reviews,
    rentalRequests: property.rentalRequests,
    averageRating: Number(avgRating.toFixed(1)),
    reviewCount: reviews.length,
    ratingDistribution,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  };
};

// =============================================
// 4. প্রপার্টি আপডেট (Admin + Owner) - ⭐ আপডেটেড
// =============================================
const updateProperty = async (
  propertyId: string,
  userId: string,
  userRole: string,
  payload: any,
) => {
  // ===== প্রপার্টি আছে কিনা চেক =====
  const existingProperty = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!existingProperty) {
    throw new Error("Property not found");
  }

  // ===== অথোরাইজেশন চেক =====
  const isAdmin = userRole === "ADMIN";
  const isOwner = existingProperty.landlordId === userId;

  // Admin না এবং Owner না হলে আপডেট করতে পারবে না
  if (!isAdmin && !isOwner) {
    throw new Error("You are not authorized to update this property");
  }

  const {
    categoryId,
    categoryName,
    title,
    description,
    images,
    price,
    location,
    bedrooms,
    bathrooms,
    size,
    amenities,
    availability,
  } = payload;

  // ===== ক্যাটেগরি হ্যান্ডেল =====
  let finalCategoryId = categoryId;

  if (!categoryId && categoryName) {
    const category = await prisma.category.findFirst({
      where: {
        name: {
          equals: categoryName,
          mode: "insensitive",
        },
      },
    });

    if (!category) {
      throw new Error(`Category "${categoryName}" not found`);
    }

    finalCategoryId = category.id;
  }

  // ===== আপডেট ডেটা প্রিপেয়ার =====
  const updateData: any = {};
  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (images) updateData.images = images;
  if (price) updateData.price = parseFloat(price);
  if (location) updateData.location = location;
  if (bedrooms) updateData.bedrooms = parseInt(bedrooms);
  if (bathrooms) updateData.bathrooms = parseInt(bathrooms);
  if (size) updateData.size = parseFloat(size);
  if (amenities) updateData.amenities = amenities;
  if (availability) updateData.availability = availability;
  if (finalCategoryId) updateData.categoryId = finalCategoryId;

  // ===== প্রপার্টি আপডেট =====
  const property = await prisma.property.update({
    where: { id: propertyId },
    data: updateData,
    include: {
      category: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return {
    message: `Property "${property.title}" updated successfully by ${isAdmin ? "Admin" : "Landlord"}`,
    updatedBy: isAdmin ? "Admin" : "Landlord",
    property,
  };
};

// =============================================
// 5. প্রপার্টি ডিলিট (Admin + Owner) - ⭐ আপডেটেড
// =============================================
const deleteProperty = async (
  propertyId: string,
  userId: string,
  userRole: string,
) => {
  // ===== প্রপার্টি আছে কিনা চেক =====
  const existingProperty = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      _count: {
        select: {
          reviews: true,
          rentalRequests: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!existingProperty) {
    throw new Error("Property not found");
  }

  // ===== অথোরাইজেশন চেক =====
  const isAdmin = userRole === "ADMIN";
  const isOwner = existingProperty.landlordId === userId;

  // Admin না এবং Owner না হলে ডিলিট করতে পারবে না
  if (!isAdmin && !isOwner) {
    throw new Error("You are not authorized to delete this property");
  }

  // ===== চেক করুন রিভিউ বা রিকোয়েস্ট আছে কিনা =====
  if (
    existingProperty._count.reviews > 0 ||
    existingProperty._count.rentalRequests > 0
  ) {
    throw new Error(
      `Cannot delete property because it has ${existingProperty._count.reviews} reviews and ${existingProperty._count.rentalRequests} rental requests`,
    );
  }

  // ===== প্রপার্টি ডিলিট =====
  await prisma.property.delete({
    where: { id: propertyId },
  });

  return {
    message: `Property "${existingProperty.title}" deleted successfully by ${isAdmin ? "Admin" : "Landlord"}`,
    deletedProperty: {
      id: existingProperty.id,
      title: existingProperty.title,
      location: existingProperty.location,
      deletedBy: isAdmin ? "Admin" : "Landlord",
      landlord: {
        id: existingProperty.user.id,
        name: existingProperty.user.name,
        email: existingProperty.user.email,
      },
    },
  };
};

// =============================================
// 6. ল্যান্ডলর্ডের সব প্রপার্টি
// =============================================
const getLandlordProperties = async (landlordId: string, query: any) => {
  const { availability, search, limit = 10, page = 1 } = query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = {
    landlordId,
  };

  if (availability) {
    where.availability = availability;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: {
        category: true,
        reviews: {
          select: {
            rating: true,
          },
        },
        rentalRequests: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.property.count({ where }),
  ]);

  const propertiesWithStats = properties.map((property: any) => {
    const reviews = property.reviews || [];
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
          reviews.length
        : 0;

    return {
      id: property.id,
      title: property.title,
      description: property.description,
      images: property.images,
      price: property.price,
      location: property.location,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      size: property.size,
      amenities: property.amenities,
      availability: property.availability,
      category: property.category,
      averageRating: Number(avgRating.toFixed(1)),
      reviewCount: reviews.length,
      rentalRequestCount: property.rentalRequests.length,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };
  });

  return {
    data: propertiesWithStats,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

// =============================================
// 7. প্রপার্টি এভেইলেবিলিটি টগল (শুধু Owner)
// =============================================
const togglePropertyAvailability = async (
  propertyId: string,
  landlordId: string,
) => {
  const existingProperty = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!existingProperty) {
    throw new Error("Property not found");
  }

  if (existingProperty.landlordId !== landlordId) {
    throw new Error("You are not authorized to update this property");
  }

  const newAvailability =
    existingProperty.availability === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";

  const property = await prisma.property.update({
    where: { id: propertyId },
    data: {
      availability: newAvailability,
    },
    include: {
      category: true,
    },
  });

  return {
    message: `Property availability updated to ${newAvailability}`,
    property,
  };
};

// =============================================
// Export
// =============================================
export const propertyServices = {
  createLandlordProperties,
  getAllProperties,
  getSingleProperty,
  updateProperty,
  deleteProperty,
  getLandlordProperties,
  togglePropertyAvailability,
};
