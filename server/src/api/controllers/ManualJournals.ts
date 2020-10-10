import { Request, Response, Router, NextFunction } from 'express';
import { check, param, query } from 'express-validator';
import BaseController from 'api/controllers/BaseController';
import asyncMiddleware from 'api/middleware/asyncMiddleware';
import ManualJournalsService from 'services/ManualJournals/ManualJournalsService';
import { Inject, Service } from "typedi";
import { ServiceError } from 'exceptions';
import DynamicListingService from 'services/DynamicListing/DynamicListService';

@Service()
export default class ManualJournalsController extends BaseController {

  @Inject()
  manualJournalsService: ManualJournalsService;

  @Inject()
  dynamicListService: DynamicListingService;

  /**
   * Router constructor.
   */
  router() {
    const router = Router();

    router.get(
      '/', [
        ...this.manualJournalsListSchema,
    ],
      this.validationResult,
      asyncMiddleware(this.getManualJournalsList.bind(this)),
      this.dynamicListService.handlerErrorsToResponse,
      this.catchServiceErrors,
    );
    router.get(
      '/:id',
      asyncMiddleware(this.getManualJournal.bind(this)),
      this.catchServiceErrors,
    );
    router.post(
      '/publish', [
        ...this.manualJournalIdsSchema,
      ],
      this.validationResult,
      asyncMiddleware(this.publishManualJournals.bind(this)),
      this.catchServiceErrors,
    );
    router.post(
      '/:id/publish', [
        ...this.manualJournalParamSchema,
      ],
      this.validationResult,
      asyncMiddleware(this.publishManualJournal.bind(this)),
      this.catchServiceErrors,
    );
    router.post(
      '/:id', [
        ...this.manualJournalValidationSchema,
        ...this.manualJournalParamSchema,
    ],
      this.validationResult,
      asyncMiddleware(this.editManualJournal.bind(this)),
      this.catchServiceErrors,
    );
    router.delete(
      '/:id', [
        ...this.manualJournalParamSchema,
      ],
      this.validationResult,
      asyncMiddleware(this.deleteManualJournal.bind(this)),
      this.catchServiceErrors,
    );
    router.delete(
      '/', [
        ...this.manualJournalIdsSchema,
      ],
      this.validationResult,
      asyncMiddleware(this.deleteBulkManualJournals.bind(this)),
      this.catchServiceErrors,
    );
    router.post(
      '/', [
        ...this.manualJournalValidationSchema,
      ],
      this.validationResult,
      asyncMiddleware(this.makeJournalEntries.bind(this)),
      this.catchServiceErrors,
    );
    return router;
  }

  /**
   * Specific manual journal id param validation schema.
   */
  get manualJournalParamSchema() {
    return [
      param('id').exists().isNumeric().toInt()
    ];
  }

  /**
   * Manual journal bulk ids validation schema.
   */
  get manualJournalIdsSchema() {
    return [
      query('ids').isArray({ min: 1 }),
      query('ids.*').isNumeric().toInt(),
    ]
  }

  /**
   * Manual journal DTO schema.
   */
  get manualJournalValidationSchema() {
    return [
      check('date').exists().isISO8601(),
      check('journal_number').exists().trim().escape(),
      check('journal_type').optional({ nullable: true }).trim().escape(),
      check('reference').optional({ nullable: true }),
      check('description').optional().trim().escape(),
      check('status').optional().isBoolean().toBoolean(),
      check('entries').isArray({ min: 2 }),
      check('entries.*.index').exists().isNumeric().toInt(),
      check('entries.*.credit')
        .optional({ nullable: true })
        .isNumeric()
        .isDecimal()
        .isFloat({ max: 9999999999.999 }) // 13, 3
        .toFloat(),
      check('entries.*.debit')
        .optional({ nullable: true })
        .isNumeric()
        .isDecimal()
        .isFloat({ max: 9999999999.999 }) // 13, 3
        .toFloat(),
      check('entries.*.account_id').isNumeric().toInt(),
      check('entries.*.note').optional(),
      check('entries.*.contact_id')
        .optional({ nullable: true })
        .isNumeric()
        .toInt(),
      check('entries.*.contact_type').optional().isIn(['vendor', 'customer']),
    ]
  }

  /**
   * Manual journals list validation schema.
   */
  get manualJournalsListSchema() {
    return [
      query('page').optional().isNumeric().toInt(),
      query('page_size').optional().isNumeric().toInt(),
      query('custom_view_id').optional().isNumeric().toInt(),

      query('column_sort_by').optional().trim().escape(),
      query('sort_order').optional().isIn(['desc', 'asc']),

      query('stringified_filter_roles').optional().isJSON(),
    ];
  }

  async getManualJournal(req: Request, res: Response, next: NextFunction) {
    const { tenantId } = req;
    const { id: manualJournalId } = req.params;

    try {
      const manualJournal = await this.manualJournalsService.getManualJournal(tenantId, manualJournalId);
      return res.status(200).send({ manualJournal });
    } catch (error) {
      next(error);
    };
  }
  
  /**
   * Publish the given manual journal.
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   */
  async publishManualJournal(req: Request, res: Response, next: NextFunction) {
    const { tenantId } = req;
    const { id: manualJournalId } = req.params;

    try {
      await this.manualJournalsService.publishManualJournal(tenantId, manualJournalId);

      return res.status(200).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Publish the given manual journals in bulk.
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   */
  async publishManualJournals(req: Request, res: Response, next: NextFunction) {
    const { tenantId } = req;
    const { ids: manualJournalsIds } = req.query;

    try {
      await this.manualJournalsService.publishManualJournals(tenantId, manualJournalsIds);

      return res.status(200).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete the given manual journal.
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   */
  async deleteManualJournal(req: Request, res: Response, next: NextFunction) {
    const { tenantId, user } = req;
    const { id: manualJournalId } = req.params;

    try {
      await this.manualJournalsService.deleteManualJournal(tenantId, manualJournalId);
      return res.status(200).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes manual journals in bulk.
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   */
  async deleteBulkManualJournals(req: Request, res: Response, next: NextFunction) {
    const { tenantId } = req;
    const { ids: manualJournalsIds } = req.query;

    try {
      await this.manualJournalsService.deleteManualJournals(tenantId, manualJournalsIds);
      return res.status(200).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Make manual journal.
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   */
  async makeJournalEntries(req: Request, res: Response, next: NextFunction) {
    const { tenantId, user } = req;
    const manualJournalDTO = this.matchedBodyData(req);

    try {
      const { manualJournal } = await this.manualJournalsService.makeJournalEntries(tenantId, manualJournalDTO, user);

      return res.status(200).send({ id: manualJournal.id });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Edit the given manual journal.
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   */
  async editManualJournal(req: Request, res: Response, next: NextFunction) {
    const { tenantId, user } = req;
    const { id: manualJournalId } = req.params;
    const manualJournalDTO = this.matchedBodyData(req);

    try {
      const { manualJournal } = await this.manualJournalsService.editJournalEntries(
        tenantId,
        manualJournalId,
        manualJournalDTO,
        user,
      );
      return res.status(200).send({ id: manualJournal.id });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve manual journals list.
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   */
  async getManualJournalsList(req: Request, res: Response, next: NextFunction) {
    const { tenantId } = req;
    const filter = {
      sortOrder: 'asc',
      columnSortBy: 'created_at',
      filterRoles: [],
      page: 1,
      pageSize: 12,
      ...this.matchedQueryData(req),
    }
    if (filter.stringifiedFilterRoles) {
      filter.filterRoles = JSON.parse(filter.stringifiedFilterRoles);
    }
    try {
      const { manualJournals, pagination, filterMeta } = await this.manualJournalsService.getManualJournals(tenantId, filter);

      return res.status(200).send({
        manual_journals: manualJournals,
        pagination: this.transfromToResponse(pagination),
        filter_meta: this.transfromToResponse(filterMeta), 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Catches all service errors.
   * @param error 
   * @param {Request} req 
   * @param {Response} res 
   * @param {NextFunction} next 
   */
  catchServiceErrors(error, req: Request, res: Response, next: NextFunction) {
    if (error instanceof ServiceError) {
      if (error.errorType === 'manual_journal_not_found') {
        res.boom.badRequest(
          'Manual journal not found.',
          { errors: [{ type: 'MANUAL.JOURNAL.NOT.FOUND', code: 100 }], }
        )
      }
      if (error.errorType === 'credit_debit_not_equal_zero') {
        return res.boom.badRequest(
          'Credit and debit should not be equal zero.',
          { errors: [{ type: 'CREDIT.DEBIT.SUMATION.SHOULD.NOT.EQUAL.ZERO', code: 400, }] }
        )
      }
      if (error.errorType === 'credit_debit_not_equal') {
        return res.boom.badRequest(
          'Credit and debit should be equal.',
          { errors: [{ type: 'CREDIT.DEBIT.NOT.EQUALS', code: 100 }] }
        )
      }
      if (error.errorType === 'acccounts_ids_not_found') {
        return res.boom.badRequest(
          'Journal entries some of accounts ids not exists.',
          { errors: [{ type: 'ACCOUNTS.IDS.NOT.FOUND', code: 200 }] }
        )
      }
      if (error.errorType === 'journal_number_exists') {
        return res.boom.badRequest(
          'Journal number should be unique.',
          { errors: [{ type: 'JOURNAL.NUMBER.ALREADY.EXISTS', code: 300 }] },
        );
      }
      if (error.errorType === 'payabel_entries_have_no_vendors') {
        return res.boom.badRequest(
          '',
          { errors: [{ type: '' }] },
        );
      }
      if (error.errorType === 'receivable_entries_have_no_customers') {
        return res.boom.badRequest(
          '',
          { errors: [{ type: '' }] },
        );
      }
      if (error.errorType === 'contacts_not_found') {
        return res.boom.badRequest(
          '',
          { errors: [{ type: '' }] },
        );
      }
    }
    next(error);
  }
}