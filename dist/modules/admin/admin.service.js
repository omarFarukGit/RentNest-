// admin.service.ts
import { prisma } from "../../lib/prisma.js";
// =============================================
// Helper: Decimal to Number
// =============================================
const toNumber = (value) => {
    return Number(value) || 0;
};
// =============================================
// 1. সব ইউজার দেখা (Admin Only)
// =============================================
const getAllUsers = async (query) => {
    const { search, role, status, sortBy = "createdAt", sortOrder = "desc", limit = 10, page = 1, } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
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
                        landlordRequests: true,
                        tenantRequests: true,
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
const updateUser = async (userId, payload) => {
    const { name, email, phone, role, status, address, profileImage, avatar } = payload;
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
    const updateData = {};
    if (name)
        updateData.name = name;
    if (email)
        updateData.email = email;
    if (phone)
        updateData.phone = phone;
    if (role)
        updateData.role = role;
    if (status)
        updateData.status = status;
    if (address)
        updateData.address = address;
    if (profileImage)
        updateData.profileImage = profileImage;
    if (avatar)
        updateData.avatar = avatar;
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
const getSingleUser = async (userId) => {
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
                    createdAt: "desc",
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
                    createdAt: "desc",
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
const adminGetAllProperties = async (query) => {
    const { category, categoryName, categoryId, minPrice, maxPrice, bedrooms, bathrooms, minSize, maxSize, availability, search, landlordId, sortBy = "createdAt", sortOrder = "desc", limit = 10, page = 1, } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    // ===== ক্যাটেগরি ফিল্টার =====
    if (categoryId) {
        where.categoryId = categoryId;
    }
    else if (category || categoryName) {
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
        if (minPrice)
            where.price.gte = parseFloat(minPrice);
        if (maxPrice)
            where.price.lte = parseFloat(maxPrice);
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
        if (minSize)
            where.size.gte = parseFloat(minSize);
        if (maxSize)
            where.size.lte = parseFloat(maxSize);
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
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;
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
                ratingDistribution[review.rating]++;
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
const adminUpdateProperty = async (propertyId, payload) => {
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
    const { title, description, images, price, location, categoryId, categoryName, bedrooms, bathrooms, size, amenities, availability, } = payload;
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
    const updateData = {};
    if (title)
        updateData.title = title;
    if (description)
        updateData.description = description;
    if (images)
        updateData.images = images;
    if (price)
        updateData.price = parseFloat(price);
    if (location)
        updateData.location = location;
    if (bedrooms)
        updateData.bedrooms = parseInt(bedrooms);
    if (bathrooms)
        updateData.bathrooms = parseInt(bathrooms);
    if (size)
        updateData.size = parseFloat(size);
    if (amenities)
        updateData.amenities = amenities;
    if (availability)
        updateData.availability = availability;
    if (finalCategoryId)
        updateData.categoryId = finalCategoryId;
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
const adminDeleteProperty = async (propertyId) => {
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
    if (existingProperty._count.reviews > 0 ||
        existingProperty._count.rentalRequests > 0) {
        throw new Error(`Cannot delete property because it has ${existingProperty._count.reviews} reviews and ${existingProperty._count.rentalRequests} rental requests`);
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
// =============================================
// ✅ 7. সব রেন্টাল রিকোয়েস্ট দেখা (Admin Only) - NEW
// =============================================
const adminGetAllRentals = async (query) => {
    const { status, propertyId, tenantId, landlordId, startDate, endDate, sortBy = "createdAt", sortOrder = "desc", limit = 10, page = 1, } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    // ===== Filters =====
    if (status) {
        where.status = status;
    }
    if (propertyId) {
        where.propertyId = propertyId;
    }
    if (tenantId) {
        where.tenantId = tenantId;
    }
    if (landlordId) {
        where.landlordId = landlordId;
    }
    if (startDate) {
        where.startDate = { gte: new Date(startDate) };
    }
    if (endDate) {
        where.endDate = { lte: new Date(endDate) };
    }
    // ===== Get Rental Requests =====
    const [rentals, total] = await Promise.all([
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
                landlord: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                    },
                },
                payment: {
                    select: {
                        id: true,
                        amount: true,
                        status: true,
                        provider: true,
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
        prisma.rentalRequest.count({ where }),
    ]);
    // ===== Statistics =====
    const stats = await prisma.rentalRequest.aggregate({
        where,
        _count: {
            id: true,
        },
    });
    const statusStats = await prisma.rentalRequest.groupBy({
        by: ["status"],
        where,
        _count: {
            status: true,
        },
    });
    // ===== Format Response =====
    const formattedRentals = rentals.map((rental) => ({
        id: rental.id,
        property: rental.property,
        tenant: rental.tenant,
        landlord: rental.landlord,
        status: rental.status,
        message: rental.message,
        startDate: rental.startDate,
        endDate: rental.endDate,
        payment: rental.payment
            ? {
                ...rental.payment,
                amount: toNumber(rental.payment.amount),
            }
            : null,
        createdAt: rental.createdAt,
        updatedAt: rental.updatedAt,
    }));
    return {
        data: formattedRentals,
        stats: {
            total: stats._count.id || 0,
            byStatus: statusStats.map((item) => ({
                status: item.status,
                count: item._count.status,
            })),
        },
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    };
};
// =============================================
// ✅ 8. সিঙ্গেল রেন্টাল রিকোয়েস্ট দেখা (Admin Only) - NEW
// =============================================
const adminGetSingleRental = async (rentalId) => {
    const rental = await prisma.rentalRequest.findUnique({
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
                    address: true,
                    createdAt: true,
                },
            },
            landlord: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    profileImage: true,
                    address: true,
                    createdAt: true,
                },
            },
            payment: {
                select: {
                    id: true,
                    amount: true,
                    provider: true,
                    transactionId: true,
                    status: true,
                    paymentDetails: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    });
    if (!rental) {
        throw new Error("Rental request not found");
    }
    return {
        ...rental,
        payment: rental.payment
            ? {
                ...rental.payment,
                amount: toNumber(rental.payment.amount),
            }
            : null,
    };
};
// =============================================
// ✅ 9. রেন্টাল স্ট্যাটাস আপডেট (Admin Only) - NEW
// =============================================
const adminUpdateRentalStatus = async (rentalId, payload) => {
    const { status } = payload;
    if (!status) {
        throw new Error("Status is required");
    }
    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }
    // ===== Check if rental exists =====
    const rental = await prisma.rentalRequest.findUnique({
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
        },
    });
    if (!rental) {
        throw new Error("Rental request not found");
    }
    // ===== Update rental status =====
    const updatedRental = await prisma.rentalRequest.update({
        where: { id: rentalId },
        data: { status },
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
    // ===== If approved, update property availability =====
    if (status === "APPROVED") {
        await prisma.property.update({
            where: { id: rental.propertyId },
            data: { availability: "RENTED" },
        });
    }
    // ===== If rejected or cancelled, update property availability =====
    if (status === "REJECTED" || status === "CANCELLED") {
        const otherApproved = await prisma.rentalRequest.findFirst({
            where: {
                propertyId: rental.propertyId,
                id: { not: rentalId },
                status: "APPROVED",
            },
        });
        if (!otherApproved) {
            await prisma.property.update({
                where: { id: rental.propertyId },
                data: { availability: "AVAILABLE" },
            });
        }
    }
    return {
        message: `Rental request ${status.toLowerCase()} successfully by Admin`,
        rental: updatedRental,
    };
};
// =============================================
// ✅ 10. রেন্টাল রিকোয়েস্ট ডিলিট (Admin Only) - NEW
// =============================================
const adminDeleteRental = async (rentalId) => {
    // ===== Check if rental exists =====
    const rental = await prisma.rentalRequest.findUnique({
        where: { id: rentalId },
        include: {
            payment: true,
        },
    });
    if (!rental) {
        throw new Error("Rental request not found");
    }
    // ===== Check if payment exists =====
    if (rental.payment) {
        throw new Error("Cannot delete rental request with existing payment");
    }
    // ===== Delete rental =====
    await prisma.rentalRequest.delete({
        where: { id: rentalId },
    });
    return {
        message: "Rental request deleted successfully by Admin",
        deletedRental: {
            id: rental.id,
            propertyId: rental.propertyId,
            tenantId: rental.tenantId,
            landlordId: rental.landlordId,
            status: rental.status,
        },
    };
};
// =============================================
// Export
// =============================================
export const adminServices = {
    getAllUsers,
    getSingleUser,
    updateUser,
    adminGetAllProperties,
    adminUpdateProperty,
    adminDeleteProperty,
    // ✅ New Rental Functions
    adminGetAllRentals,
    adminGetSingleRental,
    adminUpdateRentalStatus,
    adminDeleteRental,
};
//# sourceMappingURL=admin.service.js.map