// src/controllers/guests-controller.ts

import guestModel, { IGuest } from '../models/guest-model';
import { BaseController } from './base-controller';

class GuestsController extends BaseController<IGuest> {
  constructor() {
    super(guestModel);
  }

}

export default new GuestsController();
