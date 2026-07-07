// admin.service.ts
import { prisma } from "../../lib/prisma";

// =============================================
// 1. সব ইউজার দেখা (Admin Only)
// =============================================
const getAllUsers = async (query: any) => {
  const {
    search,
    role,
    status,
    sortBy = "createdAt",
    sortOrder = "desc",
    limit = 10,
    page = 1,
  } = query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = {};

  // ===== সার্চ ফিল্টার =====
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  // ===== রোল ফিল্টার =====
  if (role) {
    where.role = role;
  }

  // ===== স্ট্যাটাস ফিল্টার =====
  if (status) {
    where.status = status;
  }

  // ===== ডেটা আনা =====
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        address: true,
        profileImage: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            properties: true,
            reviews: true,
            landlordRequests: true,  // ✅ সঠিক ফিল্ড
            tenantRequests: true,    // ✅ সঠিক ফিল্ড
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.user.count({ where }),
  ]);

  // ===== ডেটা ফরম্যাট =====
  const formattedUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    address: user.address,
    profileImage: user.profileImage,
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    stats: {
      totalProperties: user._count.properties || 0,
      totalReviews: user._count.reviews || 0,
      totalLandlordRequests: user._count.landlordRequests || 0,
      totalTenantRequests: user._count.tenantRequests || 0,
      totalRequests: (user._count.landlordRequests || 0) + (user._count.tenantRequests || 0),
    },
  }));

  return {
    data: formattedUsers,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

// =============================================
// 2. ইউজার আপডেট (Admin Only)
// =============================================
const updateUser = async (userId: string, payload: any) => {
  const { 
    name, 
    email, 
    phone, 
    role, 
    status, 
    address, 
    profileImage,
    avatar 
  } = payload;

  // ===== ইউজার আছে কিনা চেক =====
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  // ===== ইমেইল ইউনিক চেক =====
  if (email && email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email },
    });

    if (emailExists) {
      throw new Error(`Email "${email}" already exists`);
    }
  }

  // ===== আপডেট ডেটা প্রিপেয়ার =====
  const updateData: any = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;
  if (role) updateData.role = role;
  if (status) updateData.status = status;
  if (address) updateData.address = address;
  if (profileImage) updateData.profileImage = profileImage;
  if (avatar) updateData.avatar = avatar;

  // ===== ইউজার আপডেট =====
  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      address: true,
      profileImage: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    message: `User "${user.name}" updated successfully by Admin`,
    user,
  };
};

// =============================================
// 3. সিঙ্গেল ইউজার দেখা (Admin Only)
// =============================================
const getSingleUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      address: true,
      profileImage: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          properties: true,
          reviews: true,
          landlordRequests: true,
          tenantRequests: true,
        },
      },
      properties: {
        select: {
          id: true,
          title: true,
          price: true,
          location: true,
          availability: true,
          createdAt: true,
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    ...user,
    stats: {
      totalProperties: user._count.properties || 0,
      totalReviews: user._count.reviews || 0,
      totalLandlordRequests: user._count.landlordRequests || 0,
      totalTenantRequests: user._count.tenantRequests || 0,
    },
  };
};

// =============================================
// 4. সব প্রপার্টি দেখা (Admin Only)
// =============================================
const adminGetAllProperties = async (query: any) => {
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

  // ===== ক্যাটেগরি ফিল্টার =====
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

  // ===== প্রাইস ফিল্টার =====
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  // ===== বেডরুম ফিল্টার =====
  if (bedrooms) {
    where.bedrooms = parseInt(bedrooms);
  }

  // ===== বাথরুম ফিল্টার =====
  if (bathrooms) {
    where.bathrooms = parseInt(bathrooms);
  }

  // ===== সাইজ ফিল্টার =====
  if (minSize || maxSize) {
    where.size = {};
    if (minSize) where.size.gte = parseFloat(minSize);
    if (maxSize) where.size.lte = parseFloat(maxSize);
  }

  // ===== এভেইলেবিলিটি ফিল্টার =====
  if (availability) {
    where.availability = availability;
  }

  // ===== ল্যান্ডলর্ড ফিল্টার =====
  if (landlordId) {
    where.landlordId = landlordId;
  }

  // ===== টেক্সট সার্চ =====
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  // ===== ডেটা আনা =====
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
            profileImage: true,
            createdAt: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
        rentalRequests: {
          select: {
            id: true,
            status: true,
            message: true,
            startDate: true,
            endDate: true,
            createdAt: true,
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

  // ===== রেটিং ক্যালকুলেশন =====
  const propertiesWithRating = properties.map((property) => {
    const reviews = property.reviews || [];
    const totalRating = reviews.reduce(
      (sum: number, r: any) => sum + r.rating,
      0,
    );
    const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    // ===== রেটিং ডিস্ট্রিবিউশন =====
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
      landlord: {
        id: property.user.id,
        name: property.user.name,
        email: property.user.email,
        phone: property.user.phone,
        role: property.user.role,
        status: property.user.status,
        profileImage: property.user.profileImage,
      },
      reviews: property.reviews,
      rentalRequests: property.rentalRequests,
      stats: {
        averageRating: Number(avgRating.toFixed(1)),
        reviewCount: reviews.length,
        rentalRequestCount: property.rentalRequests.length,
        ratingDistribution,
      },
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
// 5. প্রপার্টি আপডেট (Admin Only)
// =============================================
const adminUpdateProperty = async (propertyId: string, payload: any) => {
  // ===== প্রপার্টি আছে কিনা চেক =====
  const existingProperty = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      category: true,
    },
  });

  if (!existingProperty) {
    throw new Error("Property not found");
  }

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
          role: true,
          status: true,
          profileImage: true,
        },
      },
    },
  });

  return {
    message: `Property "${property.title}" updated successfully by Admin`,
    updatedBy: "Admin",
    property,
  };
};

// =============================================
// 6. প্রপার্টি ডিলিট (Admin Only)
// =============================================
const adminDeleteProperty = async (propertyId: string) => {
  // ===== প্রপার্টি আছে কিনা চেক =====
  const existingProperty = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          reviews: true,
          rentalRequests: true,
        },
      },
    },
  });

  if (!existingProperty) {
    throw new Error("Property not found");
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
    message: `Property "${existingProperty.title}" deleted successfully by Admin`,
    deletedProperty: {
      id: existingProperty.id,
      title: existingProperty.title,
      location: existingProperty.location,
      landlord: {
        id: existingProperty.user.id,
        name: existingProperty.user.name,
        email: existingProperty.user.email,
      },
    },
  };
};

export const adminServices = {
  getAllUsers,
  getSingleUser,
  updateUser,
  adminGetAllProperties,
  adminUpdateProperty,
  adminDeleteProperty,
};