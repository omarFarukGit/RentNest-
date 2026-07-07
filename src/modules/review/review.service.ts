// review.service.ts
import { prisma } from "../../lib/prisma";

// =============================================
// 1. রিভিউ তৈরি (Tenant Only)
// =============================================
const createReview = async (tenantId: string, payload: any) => {
  // ===== পেলোড চেক =====
  if (!payload) {
    throw new Error("Request body is required");
  }

  const { propertyId, rating, comment } = payload;

  // ===== ভ্যালিডেশন =====
  if (!tenantId) {
    throw new Error("User ID is required");
  }

  if (!propertyId) {
    throw new Error("Property ID is required");
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // ===== প্রপার্টি আছে কিনা চেক =====
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!property) {
    throw new Error("Property not found");
  }

  //   // ===== ইউজার কি এই প্রপার্টি ভাড়া নিয়েছে চেক =====
  //   const hasRented = await prisma.rentalRequest.findFirst({
  //     where: {
  //       propertyId,
  //       tenantId,
  //       status: "APPROVED",
  //     },
  //   });

  //   if (!hasRented) {
  //     throw new Error("You can only review properties you have rented");
  //   }

  // ===== ইতিমধ্যে রিভিউ দিয়েছে কিনা চেক =====
  const existingReview = await prisma.review.findFirst({
    where: {
      propertyId,
      tenantId, // ✅ tenantId ব্যবহার করুন
    },
  });

  if (existingReview) {
    throw new Error("You have already reviewed this property");
  }

  // ===== রিভিউ তৈরি =====
  const review = await prisma.review.create({
    data: {
      propertyId,
      tenantId, // ✅ tenantId ব্যবহার করুন
      rating: parseInt(rating),
      comment: comment || "",
    },
    include: {
      user: {
        // ✅ user রিলেশন
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          avatar: true,
        },
      },
      property: {
        select: {
          id: true,
          title: true,
          location: true,
          price: true,
          images: true,
        },
      },
    },
  });

  return {
    message: "Review created successfully",
    review,
  };
};

// =============================================
// 2. প্রপার্টির সব রিভিউ দেখা (Public)
// =============================================
const getPropertyReviews = async (propertyId: string, query: any) => {
  // ===== ভ্যালিডেশন =====
  if (!propertyId) {
    throw new Error("Property ID is required");
  }

  const {
    rating,
    sortBy = "createdAt",
    sortOrder = "desc",
    limit = 10,
    page = 1,
  } = query;

  // ===== প্রপার্টি আছে কিনা চেক =====
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      title: true,
      location: true,
      price: true,
      images: true,
      availability: true,
    },
  });

  if (!property) {
    throw new Error("Property not found");
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = {
    propertyId,
  };

  if (rating) {
    where.rating = parseInt(rating);
  }

  // ===== রিভিউ ডেটা আনা =====
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: {
          // ✅ user রিলেশন
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            avatar: true,
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.review.count({ where }),
  ]);

  // ===== রেটিং ক্যালকুলেশন =====
  const allReviews = await prisma.review.findMany({
    where: { propertyId },
    select: {
      rating: true,
    },
  });

  const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating =
    allReviews.length > 0 ? totalRating / allReviews.length : 0;

  // ===== রেটিং ডিস্ট্রিবিউশন =====
  const ratingDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  allReviews.forEach((review) => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    }
  });

  return {
    property: {
      id: property.id,
      title: property.title,
      location: property.location,
      price: property.price,
      images: property.images,
      availability: property.availability,
    },
    stats: {
      totalReviews: allReviews.length,
      averageRating: Number(averageRating.toFixed(1)),
      ratingDistribution,
    },
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        id: review.user.id,
        name: review.user.name,
        email: review.user.email,
        profileImage: review.user.profileImage,
        avatar: review.user.avatar,
      },
    })),
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

// =============================================
// 3. ইউজারের সব রিভিউ (Profile)
// =============================================
const getUserReviews = async (userId: string, query: any) => {
  // ===== ভ্যালিডেশন =====
  if (!userId) {
    throw new Error("User ID is required");
  }

  const {
    sortBy = "createdAt",
    sortOrder = "desc",
    limit = 10,
    page = 1,
  } = query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { tenantId: userId }, // ✅ tenantId ব্যবহার করুন
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
            price: true,
            images: true,
            availability: true,
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.review.count({ where: { tenantId: userId } }), // ✅ tenantId ব্যবহার করুন
  ]);

  return {
    data: reviews,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

// =============================================
// 4. রিভিউ আপডেট (Tenant Only)
// =============================================
const updateReview = async (
  reviewId: string,
  tenantId: string,
  payload: any,
) => {
  // ===== পেলোড চেক =====
  if (!payload) {
    throw new Error("Request body is required");
  }

  const { rating, comment } = payload;

  // ===== ভ্যালিডেশন =====
  if (!reviewId) {
    throw new Error("Review ID is required");
  }

  if (!tenantId) {
    throw new Error("User ID is required");
  }

  // ===== রিভিউ আছে কিনা চেক =====
  const existingReview = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!existingReview) {
    throw new Error("Review not found");
  }

  // ===== অথোরাইজেশন চেক (শুধু রিভিউর মালিক) =====
  if (existingReview.tenantId !== tenantId) {
    throw new Error("You are not authorized to update this review");
  }

  // ===== আপডেট ডেটা =====
  const updateData: any = {};
  if (rating) {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    updateData.rating = parseInt(rating);
  }
  if (comment) updateData.comment = comment;

  // ===== রিভিউ আপডেট =====
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          avatar: true,
        },
      },
      property: {
        select: {
          id: true,
          title: true,
          location: true,
        },
      },
    },
  });

  return {
    message: "Review updated successfully",
    review,
  };
};

// =============================================
// 5. রিভিউ ডিলিট (Tenant + Admin)
// =============================================
const deleteReview = async (
  reviewId: string,
  userId: string,
  userRole: string,
) => {
  // ===== ভ্যালিডেশন =====
  if (!reviewId) {
    throw new Error("Review ID is required");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  // ===== রিভিউ আছে কিনা চেক =====
  const existingReview = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      property: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!existingReview) {
    throw new Error("Review not found");
  }

  // ===== অথোরাইজেশন চেক =====
  const isAdmin = userRole === "ADMIN";
  const isOwner = existingReview.tenantId === userId; // ✅ tenantId ব্যবহার করুন

  if (!isAdmin && !isOwner) {
    throw new Error("You are not authorized to delete this review");
  }

  // ===== রিভিউ ডিলিট =====
  await prisma.review.delete({
    where: { id: reviewId },
  });

  return {
    message: `Review deleted successfully by ${isAdmin ? "Admin" : "User"}`,
    deletedReview: {
      id: existingReview.id,
      rating: existingReview.rating,
      comment: existingReview.comment,
      property: {
        id: existingReview.property.id,
        title: existingReview.property.title,
      },
      user: {
        id: existingReview.user.id,
        name: existingReview.user.name,
        email: existingReview.user.email,
      },
    },
  };
};

// =============================================
// 6. প্রপার্টির এভারেজ রেটিং (Helper)
// =============================================
const getPropertyRatingStats = async (propertyId: string) => {
  // ===== ভ্যালিডেশন =====
  if (!propertyId) {
    throw new Error("Property ID is required");
  }

  // ===== প্রপার্টি আছে কিনা চেক =====
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      title: true,
    },
  });

  if (!property) {
    throw new Error("Property not found");
  }

  // ===== রেটিং ডেটা আনা =====
  const reviews = await prisma.review.findMany({
    where: { propertyId },
    select: {
      rating: true,
    },
  });

  const totalReviews = reviews.length;
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

  // ===== রেটিং ডিস্ট্রিবিউশন =====
  const ratingDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  reviews.forEach((review) => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    }
  });

  return {
    propertyId,
    propertyTitle: property.title,
    totalReviews,
    averageRating: Number(averageRating.toFixed(1)),
    ratingDistribution,
  };
};

export const reviewServices = {
  createReview,
  getPropertyReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  getPropertyRatingStats,
};
