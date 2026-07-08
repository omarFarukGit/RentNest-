import { prisma } from "../../lib/prisma.js";
const createCategoryIntoDB = async (payload) => {
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
const getSingleCategoryFromDB = async (id) => {
    return await prisma.category.findUniqueOrThrow({
        where: {
            id,
        },
    });
};
const updateCategoryIntoDB = async (id, payload) => {
    return await prisma.category.update({
        where: {
            id,
        },
        data: payload,
    });
};
const deleteCategoryFromDB = async (id) => {
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
//# sourceMappingURL=category.service.js.map