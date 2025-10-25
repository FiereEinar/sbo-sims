import asyncHandler from 'express-async-handler';
import { PrelistingQueryFilterRequest } from '../types/request';
import CustomResponse from '../types/response';
import { FilterQuery } from 'mongoose';
import { IPrelisting } from '../models/prelisting';

export const prelistingQueryFilter = asyncHandler(
	async (req: PrelistingQueryFilterRequest, res, next) => {
		const {
			page,
			pageSize,
			search,
			course,
			startDate,
			endDate,
			sortByDate,
			category,
		} = req.query;
		if (!req.PrelistingModel) {
			res
				.status(500)
				.json(new CustomResponse(false, null, 'PrelistingModel not attached'));

			return;
		}

		const hasSearch = search && search.length;

		const defaultPage = 1;
		const defaultPageSize = 100;

		const pageNum = hasSearch
			? defaultPage
			: page
			? parseInt(page as string)
			: defaultPage;
		const pageSizeNum = pageSize
			? parseInt(pageSize as string)
			: defaultPageSize;
		const skipAmount = (pageNum - 1 || 0) * pageSizeNum;

		const filters: FilterQuery<IPrelisting>[] = [];

		if (startDate && endDate)
			filters.push({
				date: {
					$gte: new Date(startDate as string).toISOString(),
					$lte: new Date(endDate as string).toISOString(),
				},
			});

		if (category) filters.push({ category: category });

		const prelistings: IPrelisting[] = await req.PrelistingModel.find({
			$and: filters,
		})
			.populate({
				model: req.CategoryModel,
				path: 'category',
				populate: {
					model: req.OrganizationModel,
					path: 'organization',
				},
			})
			.populate({
				model: req.StudentModel,
				path: 'owner',
			})
			.sort({ date: sortByDate === 'asc' ? 1 : -1 })
			.exec();

		let filteredPrelisting = prelistings;

		if (search?.length) {
			filteredPrelisting = filteredPrelisting.filter((prelisting) => {
				const fullname = `${prelisting.owner.firstname} ${prelisting.owner.middlename} ${prelisting.owner.lastname}`;
				const s = search.toString().toLowerCase();

				return (
					fullname.toLowerCase().includes(s) ||
					prelisting.owner.studentID.includes(s)
				);
			});
		}

		if (course) {
			filteredPrelisting = filteredPrelisting.filter(
				(prelisting) => prelisting.owner.course === course
			);
		}

		const filteredPrelistingLength = filteredPrelisting.length;

		const nextPage =
			filteredPrelistingLength > skipAmount + pageSizeNum ? pageNum + 1 : -1;
		const prevPage = pageNum > 1 ? pageNum - 1 : -1;

		req.filteredPrelisting = filteredPrelisting;
		req.nextPage = hasSearch ? -1 : nextPage;
		req.prevPage = hasSearch ? -1 : prevPage;
		req.skipAmount = skipAmount;
		req.pageSizeNum = pageSizeNum;
		next();
	}
);
