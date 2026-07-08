// rental.service.ts
import { prisma } from "../../lib/prisma.js";

// =============================================
// 1. রেন্টাল রিকোয়েস্ট তৈরি (Tenant Only)
// =============================================
const createRentalRequest = async (tenantId: string, payload: any) => {
  // ===== পেলোড চেক =====
  if (!payload) {
    throw new Error("Request body is required");
  }

  const { propertyId, message, startDate, endDate } = payload;

  // ===== ভ্যালিডেশন =====
  if (!tenantId) {
    throw new Error("User ID is required");
  }

  if (!propertyId) {
    throw new Error("Property ID is required");
  }

  if (!startDate) {
    throw new Error("Start date is required");
  }

  if (!endDate) {
    throw new Error("End date is required");
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
          phone: true,
        },
      },
    },
  });

  if (!property) {
    throw new Error("Property not found");
  }

  // ===== প্রপার্টি এভেইলেবল কিনা চেক =====
  if (property.availability !== "AVAILABLE") {
    throw new Error("Property is not available for rent");
  }

  // ===== নিজের প্রপার্টি ভাড়া নিতে পারে না =====
  if (property.landlordId === tenantId) {
    throw new Error("You cannot rent your own property");
  }

  // ===== ডেট ভ্যালিডেশন =====
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start >= end) {
    throw new Error("End date must be after start date");
  }

  if (start < new Date()) {
    throw new Error("Start date cannot be in the past");
  }

  // ===== ইতিমধ্যে রিকোয়েস্ট আছে কিনা চেক =====
  const existingRequest = await prisma.rentalRequest.findFirst({
    where: {
      propertyId,
      tenantId,
      status: {
        in: ["PENDING", "APPROVED"],
      },
    },
  });

  if (existingRequest) {
    throw new Error("You already have a pending or approved request for this property");
  }

  // ===== ওভারল্যাপিং রিকোয়েস্ট চেক =====
  const overlappingRequests = await prisma.rentalRequest.findMany({
    where: {
      propertyId,
      status: "APPROVED",
      OR: [
        {
          AND: [
            { startDate: { lte: end } },
            { endDate: { gte: start } },
          ],
        },
      ],
    },
  });

  if (overlappingRequests.length > 0) {
    throw new Error("Property is already booked for these dates");
  }

  // ===== রেন্টাল রিকোয়েস্ট তৈরি =====
  const rentalRequest = await prisma.rentalRequest.create({
    data: {
      propertyId,
      tenantId,
      landlordId: property.landlordId,
      message: message || "",
      startDate: start,
      endDate: end,
      status: "PENDING",
    },
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
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
        },
      },
      landlord: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
        },
      },
    },
  });

  return {
    message: "Rental request created successfully",
    rentalRequest,
  };
};

// =============================================
// 2. সব রেন্টাল রিকোয়েস্ট (Tenant)
// =============================================
const getMyRentalRequests = async (tenantId: string, query: any) => {
  // ===== ভ্যালিডেশন =====
  if (!tenantId) {
    throw new Error("User ID is required");
  }

  const {
    status,
    sortBy = "createdAt",
    sortOrder = "desc",
    limit = 10,
    page = 1,
  } = query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = {
    tenantId,
  };

  if (status) {
    where.status = status;
  }

  const [rentalRequests, total] = await Promise.all([
    prisma.rentalRequest.findMany({
      where,
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
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.rentalRequest.count({ where }),
  ]);

  return {
    data: rentalRequests,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

// =============================================
// 3. ল্যান্ডলর্ডের সব রেন্টাল রিকোয়েস্ট
// =============================================
const getLandlordRentalRequests = async (landlordId: string, query: any) => {
  // ===== ভ্যালিডেশন =====
  if (!landlordId) {
    throw new Error("User ID is required");
  }

  const {
    status,
    propertyId,
    sortBy = "createdAt",
    sortOrder = "desc",
    limit = 10,
    page = 1,
  } = query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = {
    landlordId,
  };

  if (status) {
    where.status = status;
  }

  if (propertyId) {
    where.propertyId = propertyId;
  }

  const [rentalRequests, total] = await Promise.all([
    prisma.rentalRequest.findMany({
      where,
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
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder,
      },
    }),
    prisma.rentalRequest.count({ where }),
  ]);

  return {
    data: rentalRequests,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

// =============================================
// 4. সিঙ্গেল রেন্টাল রিকোয়েস্ট
// =============================================
const getSingleRentalRequest = async (rentalId: string, userId: string, userRole: string) => {
  // ===== ভ্যালিডেশন =====
  if (!rentalId) {
    throw new Error("Rental request ID is required");
  }

  // ===== রেন্টাল রিকোয়েস্ট আছে কিনা চেক =====
  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: rentalId },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          price: true,
          images: true,
          bedrooms: true,
          bathrooms: true,
          size: true,
          amenities: true,
          availability: true,
          landlordId: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
          avatar: true,
        },
      },
      landlord: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
          avatar: true,
        },
      },
    },
  });

  if (!rentalRequest) {
    throw new Error("Rental request not found");
  }

  // ===== অথোরাইজেশন চেক =====
  const isAdmin = userRole === "ADMIN";
  const isTenant = rentalRequest.tenantId === userId;
  const isLandlord = rentalRequest.landlordId === userId;

  if (!isAdmin && !isTenant && !isLandlord) {
    throw new Error("You are not authorized to view this rental request");
  }

  return rentalRequest;
};

// =============================================
// 5. রেন্টাল রিকোয়েস্ট স্ট্যাটাস আপডেট (Landlord Only)
// =============================================
const updateRentalStatus = async (
  rentalId: string,
  landlordId: string,
  payload: any
) => {
  // ===== পেলোড চেক =====
  if (!payload) {
    throw new Error("Request body is required");
  }

  const { status } = payload;

  // ===== ভ্যালিডেশন =====
  if (!rentalId) {
    throw new Error("Rental request ID is required");
  }

  if (!landlordId) {
    throw new Error("User ID is required");
  }

  if (!status) {
    throw new Error("Status is required");
  }

  const validStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  // ===== রেন্টাল রিকোয়েস্ট আছে কিনা চেক =====
  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: rentalId },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          availability: true,
          landlordId: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!rentalRequest) {
    throw new Error("Rental request not found");
  }

  // ===== অথোরাইজেশন চেক (শুধু ল্যান্ডলর্ড) =====
  if (rentalRequest.landlordId !== landlordId) {
    throw new Error("You are not authorized to update this rental request");
  }

  // ===== স্ট্যাটাস ট্রানজিশন চেক =====
  const currentStatus = rentalRequest.status;
  
  if (currentStatus === "APPROVED" && status !== "CANCELLED") {
    throw new Error("Cannot change status of an approved request");
  }

  if (currentStatus === "REJECTED" || currentStatus === "CANCELLED") {
    throw new Error(`Cannot update a ${currentStatus} request`);
  }

  // ===== যদি APPROVED হয়, প্রপার্টি এভেইলেবিলিটি আপডেট করুন =====
  let updateData: any = { status };

  if (status === "APPROVED") {
    // প্রপার্টি এভেইলেবিলিটি পরিবর্তন করুন
    await prisma.property.update({
      where: { id: rentalRequest.propertyId },
      data: { availability: "RENTED" },
    });

    // অন্যান্য PENDING রিকোয়েস্ট রিজেক্ট করুন
    await prisma.rentalRequest.updateMany({
      where: {
        propertyId: rentalRequest.propertyId,
        id: { not: rentalId },
        status: "PENDING",
      },
      data: { status: "REJECTED" },
    });
  }

  if (status === "REJECTED" || status === "CANCELLED") {
    // প্রপার্টি আবার AVAILABLE করুন (যদি এটি RENTED ছিল)
    if (rentalRequest.property.availability === "RENTED") {
      // চেক করুন অন্য কোনো APPROVED রিকোয়েস্ট আছে কিনা
      const otherApproved = await prisma.rentalRequest.findFirst({
        where: {
          propertyId: rentalRequest.propertyId,
          id: { not: rentalId },
          status: "APPROVED",
        },
      });

      if (!otherApproved) {
        await prisma.property.update({
          where: { id: rentalRequest.propertyId },
          data: { availability: "AVAILABLE" },
        });
      }
    }
  }

  // ===== রেন্টাল রিকোয়েস্ট আপডেট =====
  const updatedRequest = await prisma.rentalRequest.update({
    where: { id: rentalId },
    data: updateData,
    include: {
      property: {
        select: {
          id: true,
          title: true,
          location: true,
          price: true,
          availability: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
        },
      },
      landlord: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
        },
      },
    },
  });

  return {
    message: `Rental request ${status.toLowerCase()} successfully`,
    rentalRequest: updatedRequest,
  };
};

// =============================================
// 6. রেন্টাল রিকোয়েস্ট ক্যান্সেল (Tenant Only)
// =============================================
const cancelRentalRequest = async (rentalId: string, tenantId: string) => {
  // ===== ভ্যালিডেশন =====
  if (!rentalId) {
    throw new Error("Rental request ID is required");
  }

  if (!tenantId) {
    throw new Error("User ID is required");
  }

  // ===== রেন্টাল রিকোয়েস্ট আছে কিনা চেক =====
  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: rentalId },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          availability: true,
        },
      },
    },
  });

  if (!rentalRequest) {
    throw new Error("Rental request not found");
  }

  // ===== অথোরাইজেশন চেক =====
  if (rentalRequest.tenantId !== tenantId) {
    throw new Error("You are not authorized to cancel this rental request");
  }

  // ===== স্ট্যাটাস চেক =====
  if (rentalRequest.status === "APPROVED") {
    throw new Error("Cannot cancel an approved request. Please contact the landlord.");
  }

  if (rentalRequest.status === "REJECTED" || rentalRequest.status === "CANCELLED") {
    throw new Error(`This request is already ${rentalRequest.status.toLowerCase()}`);
  }

  // ===== রেন্টাল রিকোয়েস্ট ক্যান্সেল =====
  const cancelledRequest = await prisma.rentalRequest.update({
    where: { id: rentalId },
    data: { status: "CANCELLED" },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          location: true,
          price: true,
        },
      },
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
  });

  return {
    message: "Rental request cancelled successfully",
    rentalRequest: cancelledRequest,
  };
};

// =============================================
// 7. রেন্টাল রিকোয়েস্ট স্ট্যাটিস্টিক্স
// =============================================
const getRentalStats = async (userId: string, userRole: string) => {
  // ===== ভ্যালিডেশন =====
  if (!userId) {
    throw new Error("User ID is required");
  }

  let where: any = {};

  if (userRole === "LANDLORD") {
    where.landlordId = userId;
  } else if (userRole === "TENANT") {
    where.tenantId = userId;
  } else if (userRole === "ADMIN") {
    // Admin সব দেখতে পারে
  } else {
    throw new Error("Invalid user role");
  }

  const [total, pending, approved, rejected, cancelled] = await Promise.all([
    prisma.rentalRequest.count({ where }),
    prisma.rentalRequest.count({ where: { ...where, status: "PENDING" } }),
    prisma.rentalRequest.count({ where: { ...where, status: "APPROVED" } }),
    prisma.rentalRequest.count({ where: { ...where, status: "REJECTED" } }),
    prisma.rentalRequest.count({ where: { ...where, status: "CANCELLED" } }),
  ]);

  return {
    total,
    pending,
    approved,
    rejected,
    cancelled,
    completionRate: total > 0 ? ((approved / total) * 100).toFixed(1) : "0",
  };
};

export const rentalServices = {
  createRentalRequest,
  getMyRentalRequests,
  getLandlordRentalRequests,
  getSingleRentalRequest,
  updateRentalStatus,
  cancelRentalRequest,
  getRentalStats,
};