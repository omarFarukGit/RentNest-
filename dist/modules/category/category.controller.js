import { catchAsync } from "../../utils/catchAsync.js";
import { CategoryService } from "./category.service.js";
import { sendResponse } from "../../utils/sendResponse.js";
const createCategory = catchAsync(async (req, res) => {
    const result = await CategoryService.createCategoryIntoDB(req.body);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Category created successfully",
        data: result,
    });
});
const getAllCategories = catchAsync(async (req, res) => {
    const result = await CategoryService.getAllCategoriesFromDB();
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Categories retrieved successfully",
        data: result,
    });
});
const getSingleCategory = catchAsync(async (req, res) => {
    const result = await CategoryService.getSingleCategoryFromDB(req.params.id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Category retrieved successfully",
        data: result,
    });
});
const updateCategory = catchAsync(async (req, res) => {
    const result = await CategoryService.updateCategoryIntoDB(req.params.id, req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Category updated successfully",
        data: result,
    });
});
const deleteCategory = catchAsync(async (req, res) => {
    const result = await CategoryService.deleteCategoryFromDB(req.params.id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Category deleted successfully",
        data: result,
    });
});
export const CategoryController = {
    createCategory,
    getAllCategories,
    getSingleCategory,
    updateCategory,
    deleteCategory,
};
//# sourceMappingURL=category.controller.js.map