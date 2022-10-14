let t0 = require("./explicitLogin");
let t01 = require("../common/00_pre_configurations");
let t4a = require("../common/4a_table_view_grid_gallery_form");
let t4b = require("../common/4b_table_view_share");
let t4c = require("../common/4c_form_view_detailed");
let t4d = require("../common/4d_table_view_grid_locked");
let t4e = require("../common/4e_form_view_share");
let t4f = require("../common/4f_grid_view_share");
let t4h = require("../common/4h_kanban");
let t4i = require("../common/4i_survey_form");
const {
  setCurrentMode,
} = require("../../support/page_objects/projectConstants");

const nocoTestSuite = (apiType, dbType) => {
  setCurrentMode(apiType, dbType);
  t01.genTest(apiType, dbType);

  // place plugin related activities at top
  t4c.genTest(apiType, dbType);
  t4a.genTest(apiType, dbType);
  t4b.genTest(apiType, dbType);
  t4d.genTest(apiType, dbType);
  // to be fixed t4e.genTest(apiType, dbType);
  t4f.genTest(apiType, dbType);
  t4h.genTest(apiType, dbType);
  t4i.genTest(apiType, dbType);
};

nocoTestSuite("rest", "xcdb");

/**
 * @copyright Copyright (c) 2021, Xgene Cloud Ltd
 *
 * @author Raju Udava <sivadstala@gmail.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
