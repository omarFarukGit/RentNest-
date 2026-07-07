import { prisma } from "../../lib/prisma";

const createCategoryIntoDB = async (payload: { name: string }) => {
  return await prisma.category.create({
    data: payload,
  });
};

const getAllCategoriesFromDB = async () => {
  return await prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getSingleCategoryFromDB = async (id: string) => {
  return await prisma.category.findUniqueOrThrow({
    where: {
      id,
    },
  });
};

const updateCategoryIntoDB = async (id: string, payload: { name?: string }) => {
  return await prisma.category.update({
    where: {
      id,
    },
    data: payload,
  });
};

const deleteCategoryFromDB = async (id: string) => {
  return await prisma.category.delete({
    where: {
      id,
    },
  });
};

export const CategoryService = {
  createCategoryIntoDB,
  getAllCategoriesFromDB,
  getSingleCategoryFromDB,
  updateCategoryIntoDB,
  deleteCategoryFromDB,
};
