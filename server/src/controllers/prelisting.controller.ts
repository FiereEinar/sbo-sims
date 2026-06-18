import asyncHandler from 'express-async-handler';
import { PrelistingQueryFilterRequest } from '../types/request';
import CustomResponse, { CustomPaginatedResponse } from '../types/response';
import appAssert from '../errors/appAssert';
import { BAD_REQUEST, NOT_FOUND } from '../constants/http';
import { createPrelistingBody } from '../types/prelisting';
import CategoryModel, { ICategory } from '../models/category.model';
import { UpdateQuery } from 'mongoose';
import PrelistingModel, { IPrelisting } from '../models/prelisting.model';
import OrganizationModel from '../models/organization.model';
import StudentModel from '../models/student.model';

export const get_all_prelistings = asyncHandler(
  async (req: PrelistingQueryFilterRequest, res) => {
    const splicedFilteredPrelistings = req.filteredPrelisting?.splice(
      req.skipAmount ?? 0,
      req.pageSizeNum,
    );

    res.json(
      new CustomPaginatedResponse(
        true,
        splicedFilteredPrelistings,
        'All transactions',
        req.nextPage ?? -1,
        req.prevPage ?? -1,
      ),
    );
  },
);

export const get_prelisting = asyncHandler(async (req, res) => {
  const { prelistingID } = req.params;

  const prelisting = await PrelistingModel.findOne({
    _id: prelistingID,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  })
    .populate({
      model: CategoryModel,
      path: 'category',
      populate: {
        model: OrganizationModel,
        path: 'organization',
      },
    })
    .populate({
      model: StudentModel,
      path: 'owner',
    });

  appAssert(
    prelisting,
    NOT_FOUND,
    `Prelisting with ID: ${prelistingID} not found`,
  );

  res.json(new CustomResponse(true, prelisting, 'Prelisting'));
});

export const create_prelisting = asyncHandler(async (req, res) => {
  const {
    categoryID,
    date,
    description,
    studentID,
    details,
  }: createPrelistingBody = req.body;

  // check if the category exists
  const category = await CategoryModel.findById<ICategory>(categoryID)
    .populate({
      model: OrganizationModel,
      path: 'organization',
    })
    .exec();
  appAssert(category, NOT_FOUND, `Category with ID ${categoryID} not found`);

  // check if the student with the given ID exists
  const student = await StudentModel.findOne({
    studentID: studentID,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  }).exec();
  appAssert(student, NOT_FOUND, `Student with ID: ${studentID} not found`);

  // check if the student is within the organization
  const isInOrganization = category.organization.departments.includes(
    student.course,
  );
  appAssert(
    isInOrganization,
    BAD_REQUEST,
    `Student with ID: ${student.studentID} does not belong in the ${category.organization.name} organization. Please double check the student course if it exactly matches the departments under ${category.organization.name}`,
  );

  const detailsObj: { [key: string]: any } = {};
  category.details.map((detail) => {
    detailsObj[detail] = details[detail];
  });

  // create and save the prelisting
  const prelisting = new PrelistingModel({
    category: categoryID,
    owner: student._id,
    description: description,
    date: date ? date.toISOString() : new Date(),
    details: detailsObj,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  });
  await prelisting.save();

  res.json(
    new CustomResponse(true, prelisting, 'Prelisting saved successfully'),
  );
});

export const update_prelisting = asyncHandler(async (req, res) => {
  const { prelistingID } = req.params;
  const {
    categoryID,
    date,
    description,
    studentID,
    details,
  }: createPrelistingBody = req.body;

  // check if the category exists
  const category = await CategoryModel.findById<ICategory>(categoryID)
    .populate({
      model: OrganizationModel,
      path: 'organization',
    })
    .exec();
  appAssert(category, NOT_FOUND, `Category with ID ${categoryID} not found`);

  // check if the student with the given ID exists
  const student = await StudentModel.findOne({
    studentID: studentID,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  }).exec();
  appAssert(student, NOT_FOUND, `Student with ID: ${studentID} not found`);

  // check if the student is within the organization
  const isInOrganization = category.organization.departments.includes(
    student.course,
  );
  appAssert(
    isInOrganization,
    BAD_REQUEST,
    `Student with ID: ${student.studentID} does not belong in the ${category.organization.name} organization. Please double check the student course if it exactly matches the departments under ${category.organization.name}`,
  );

  const detailsObj: { [key: string]: any } = {};
  category.details.map((detail) => {
    detailsObj[detail] = details[detail];
  });

  // create update query and save the prelisting
  const update: UpdateQuery<IPrelisting> = {
    category: categoryID,
    owner: student._id,
    description: description,
    date: date?.toISOString(),
    details: detailsObj,
  };

  const result = await PrelistingModel.findOneAndUpdate(
    {
      _id: prelistingID,
      organization: req.tenantContext!.organizationId,
      semester: req.tenantContext!.semester,
      schoolYear: req.tenantContext!.schoolYear,
    },
    update,
    { new: true },
  ).exec();

  appAssert(result, NOT_FOUND, `Prelisting with ID: ${prelistingID} not found`);

  res.json(new CustomResponse(true, result, 'Prelisting updated successfully'));
});

export const delete_prelisting = asyncHandler(async (req, res) => {
  const { prelistingID } = req.params;

  const result = await PrelistingModel.findOneAndDelete({
    _id: prelistingID,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  });
  appAssert(
    result,
    NOT_FOUND,
    `Prelisting with ID: ${prelistingID} does not exists`,
  );

  res.json(new CustomResponse(true, result, 'Prelisting deleted successfully'));
});
