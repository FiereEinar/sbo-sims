import { Request } from 'express';
import { ITransaction } from '../models/transaction.model';
import { IPrelisting } from '../models/prelisting.model';

export type TransactionQueryFilterRequest = Request & {
  filteredTransactions?: ITransaction[];
  nextPage?: number;
  prevPage?: number;
  skipAmount?: number;
  pageSizeNum?: number;
};

export type PrelistingQueryFilterRequest = Request & {
  filteredPrelisting?: IPrelisting[];
  nextPage?: number;
  prevPage?: number;
  skipAmount?: number;
  pageSizeNum?: number;
};
