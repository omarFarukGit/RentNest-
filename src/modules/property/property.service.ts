import { prisma } from "../../lib/prisma";

const getLandlordProperties = async (landlord: string) => {};

const getLandlordPropertiesById = async () => {};

const createLandlordProperties = async (landlordId: string, payload: any) => {
  const {
    title,
    description,
    images,
    price,
    location,
    categoryId,
    categoryName, // ⭐ নতুন: নাম দিয়েও নেওয়া হবে
    bedrooms,
    bathrooms,
    size,
    amenities,
    availability,
  } = payload;

  // ===== ক্যাটেগরি হ্যান্ডেল করা =====
  let finalCategoryId = categoryId;

  // যদি categoryId না থাকে কিন্তু categoryName থাকে
  if (!categoryId && categoryName) {
    const category = await prisma.category.findFirst({
      where: {
        name: {
          equals: categoryName,
          mode: "insensitive", // case insensitive
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

  // ভ্যালিডেট: categoryId অবশ্যই থাকতে হবে
  if (!finalCategoryId) {
    throw new Error("Category ID or Category Name is required");
  }

  // ===== প্রপার্টি ক্রিয়েট =====
  const property = await prisma.property.create({
    data: {
      title,
      description,
      images: images || [],
      price: parseFloat(price),
      location,
      landlordId: landlordId, // ✅ landlordId
      categoryId: finalCategoryId, // ✅ categoryId (নাম থেকে বের করা)
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),
      size: size ? parseFloat(size) : null,
      amenities: amenities || [],
      availability: availability || "AVAILABLE",
      // ⚠️ user বা category আলাদা করে দিতে হবে না
      // কারণ landlordId এবং categoryId ইতিমধ্যেই আছে
    },
    include: {
      category: true, // ক্যাটেগরি ডিটেইলস সহ
      user: {
        // ইউজার ডিটেইলস সহ
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

const updateLandlordProperties = async () => {};

const deleteLandlordProperties = async () => {};

export const properityServices = {
  getLandlordProperties,
  getLandlordPropertiesById,
  createLandlordProperties,
  updateLandlordProperties,
  deleteLandlordProperties,
};
