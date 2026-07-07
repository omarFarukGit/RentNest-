// src/modules/category/category.service.ts

import { prisma } from "../../lib/prisma";

const createCategory = async (payload: { name: string }) => {
  // Validate that name is provided
  if (!payload.name) {
    throw new Error("Category name is required");
  }

  // Check if category with same name already exists
  const existingCategory = await prisma.category.findUnique({
    where: {
      name: payload.name, // Make sure name is not undefined
    },
  });

  if (existingCategory) {
    throw new Error(`Category with name "${payload.name}" already exists`);
  }

  const category = await prisma.category.create({
    data: {
      name: payload.name,
    },
  });

  return category;
};

export const categoryServices = {
  createCategory,
};
