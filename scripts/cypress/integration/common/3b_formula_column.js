import { mainPage } from "../../support/page_objects/mainPage";
import { loginPage } from "../../support/page_objects/navigation";
import {
  isTestSuiteActive,
  isXcdb,
} from "../../support/page_objects/projectConstants";

export const genTest = (apiType, dbType) => {
  if (!isTestSuiteActive(apiType, dbType)) return;

  describe(`${apiType.toUpperCase()} api - FORMULA`, () => {
    // Run once before test- create project (rest/graphql)
    //
    // before(() => {
    //     // loginPage.loginAndOpenProject(apiType, dbType)
    //     cy.openTableTab("City", 25);
    // });

    beforeEach(() => {
      cy.restoreLocalStorage();
    });

    afterEach(() => {
      cy.saveLocalStorage();
    });

    // after(() => {
    //     cy.closeTableTab("City");
    // });

    // Given rowname & expected result for first 10 entries, validate
    // NOTE: Scroll issue with Cypress automation, to fix
    // validating partial data, row number 5 to 9
    //
    const rowValidation = (rowName, result) => {
      // scroll back
      // cy.get(
      //     `tbody > :nth-child(1) > [data-col="City"]`
      // ).scrollIntoView();

      // for (let i = 0; i < 10; i++)
      for (let i = 3; i < 5; i++)
        mainPage
          .getCell(rowName, i + 1)
          .contains(result[i].toString())
          .should("exist");
      // cy.get(`tbody > :nth-child(${i + 1}) > [data-col="${rowName}"]`)
      //     .contains(result[i].toString())
      //     .should("exist");
    };

    // Routine to create a new look up column
    //
    const addFormulaBasedColumn = (columnName, formula) => {
      cy.get(".nc-grid  tr > th:last .nc-icon").click({
        force: true,
      });

      cy.getActiveMenu(".nc-dropdown-grid-add-column")
        .find("input.nc-column-name-input", { timeout: 3000 })
        .should("exist")
        .clear()
        .type(columnName);
      // cy.get(".nc-column-type-input").last().click().type("Formula");
      cy.getActiveMenu(".nc-dropdown-grid-add-column")
        .find(".nc-column-type-input")
        .last()
        .click()
        .type("Formula");
      cy.getActiveSelection(".nc-dropdown-column-type")
        .find(".ant-select-item-option")
        .contains("Formula")
        .click();
      cy.getActiveMenu(".nc-dropdown-grid-add-column")
        .find("textarea.nc-formula-input")
        .click()
        .type(formula, { parseSpecialCharSequences: false });
      // cy.get(".ant-btn-primary").contains("Save").should('exist').click();
      cy.getActiveMenu(".nc-dropdown-grid-add-column")
        .find(".ant-btn-primary:visible")
        .contains("Save")
        .click();

      // cy.toastWait(`Column created`);
      cy.closeTableTab("City");
      cy.openTableTab("City", 25);
      cy.get(`th[data-title="${columnName}"]`).should("exist");
    };

    // routine to delete column
    //
    const deleteColumnByName = (columnName) => {
      mainPage.deleteColumn(columnName);
    };

    // routine to edit column
    //
    const editColumnByName = (oldName, newName, newFormula) => {
      cy.get(`th:contains(${oldName}) .nc-icon.ant-dropdown-trigger`)
        .trigger("mouseover", { force: true })
        .click({ force: true });

      // cy.get(".nc-column-edit").click();
      // cy.get(".nc-column-edit").should("not.be.visible");
      cy.getActiveMenu(".nc-dropdown-column-operations")
        .find(".nc-column-edit")
        .click();

      if (newName !== oldName) {
        cy.getActiveMenu(".nc-dropdown-edit-column")
          .find("input.nc-column-name-input", { timeout: 3000 })
          .should("exist")
          .clear()
          .type(newName);
      }

      cy.get("textarea.nc-formula-input")
        .click()
        .clear()
        .type(newFormula, { parseSpecialCharSequences: false });

      cy.get(".ant-form-item-explain-error").should('not.exist');

      cy.get(".ant-btn-primary").contains("Save").should("exist").click();
      // cy.toastWait(`Column created`);
      if (newName !== oldName) {
        cy.get(`th[data-title="${oldName}"]`).should("not.exist");
      }
      cy.get(`th[data-title="${newName}"]`).should("exist");
    };

    // routine to edit a column with Circular Reference
    //
    const editCircularColumnByName = (columnName, newFormula) => {
      cy.get(`th:contains(${columnName}) .nc-icon.ant-dropdown-trigger`)
        .trigger("mouseover", { force: true })
        .click({ force: true });

      cy.getActiveMenu(".nc-dropdown-column-operations")
        .find(".nc-column-edit")
        .click();

      cy.getActiveMenu(".nc-dropdown-edit-column")
        .find("input.nc-column-name-input", { timeout: 3000 })
        .should("exist");

      cy.get("textarea.nc-formula-input")
        .click()
        .clear()
        .type(newFormula, { parseSpecialCharSequences: false });

      // clicking the Save button, should NOT submit the form
      cy.get(".ant-btn-primary").contains("Save").click();
      // therefore we can see the error
      cy.get(".ant-form-item-explain-error").contains("Can’t save field because it causes a circular reference");
      // then close the form without saving
      cy.get(".ant-btn").contains("Cancel").click();
    };

    ///////////////////////////////////////////////////
    // Test case

    // On City table (from Sakila DB), first 10 entries recorded here for verification
    let cityId = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let countryId = [87, 82, 101, 60, 97, 31, 107, 44, 44, 50];
    let city = [
      "A corua (La Corua)",
      "Abha",
      "Abu Dhabi",
      "Acua",
      "Adana",
      "Addis Abeba",
      "Aden",
      "Adoni",
      "Ahmadnagar",
      "Akishima",
    ];

    // Temporary locally computed expected results
    let RESULT_STRING = [];
    let RESULT_MATH_0 = [];
    let RESULT_MATH_1 = [];
    let RESULT_MATH_2 = [];
    let RESULT_WEEKDAY_0 = [];
    let RESULT_WEEKDAY_1 = [];
    let RESULT_CIRC_REF_0 = [];
    let RESULT_CIRC_REF_1 = [];
    let RESULT_CIRC_REF_2 = [];
    let RESULT_CIRC_REF_0_FINAL = [];
    let RESULT_CIRC_REF_2_FINAL = [];

    for (let i = 0; i < 10; i++) {
      // CONCAT, LOWER, UPPER, TRIM
      RESULT_STRING[i] = `${city[i].toUpperCase()}${city[
        i
      ].toLowerCase()}trimmed`;

      // ADD, AVG, LEN
      RESULT_MATH_0[i] =
        cityId[i] +
        countryId[i] +
        (cityId[i] + countryId[i]) / 2 +
        city[i].length;

      // CEILING, FLOOR, ROUND, MOD, MIN, MAX
      RESULT_MATH_1[i] =
        Math.ceil(1.4) +
        Math.floor(1.6) +
        Math.round(2.5) +
        (cityId[i] % 3) +
        Math.min(cityId[i], countryId[i]) +
        Math.max(cityId[i], countryId[i]);

      // LOG, EXP, POWER, SQRT
      // only integer verification being computed, hence trunc
      RESULT_MATH_2[i] = Math.trunc(
        Math.log(cityId[i]) +
        Math.exp(cityId[i]) +
        Math.pow(cityId[i], 3) +
        Math.sqrt(countryId[i])
      );

      // WEEKDAY: starts from Monday
      RESULT_WEEKDAY_0[i] = 1;
      // WEEKDAY: starts from Sunday
      RESULT_WEEKDAY_1[i] = 2;

      RESULT_CIRC_REF_0[i] = city[i]
      RESULT_CIRC_REF_1[i] = city[i]
      RESULT_CIRC_REF_2[i] = city[i] + city[i]
      RESULT_CIRC_REF_0_FINAL[i] = city[i] + city[i]
      RESULT_CIRC_REF_2_FINAL[i] = city[i] + city[i] + city[i] + city[i]
    }

    it("Formula: ADD, AVG, LEN", () => {
      cy.openTableTab("City", 25);

      addFormulaBasedColumn(
        "NC_MATH_0",
        "ADD({CityId}, {CountryId}) + AVG({CityId}, {CountryId}) + LEN({City})"
      );
      rowValidation("NC_MATH_0", RESULT_MATH_0);
    });

    it.skip("Formula: WEEKDAY", () => {
      editColumnByName("NC_MATH_0", "NC_WEEKDAY_0", `WEEKDAY("2022-07-19")`);
      rowValidation("NC_WEEKDAY_0", RESULT_WEEKDAY_0);

      editColumnByName(
        "NC_WEEKDAY_0",
        "NC_WEEKDAY_1",
        `WEEKDAY("2022-07-19", "sunday")`
      );
      rowValidation("NC_WEEKDAY_1", RESULT_WEEKDAY_1);
    });

    it("Formula: CONCAT, LOWER, UPPER, TRIM", () => {
      editColumnByName(
        // "NC_WEEKDAY_1",
        "NC_MATH_0",
        "NC_STR_1",
        `CONCAT(UPPER({City}), LOWER({City}), TRIM('    trimmed    '))`
      );
      rowValidation("NC_STR_1", RESULT_STRING);
    });

    it("Formula: CEILING, FLOOR, ROUND, MOD, MIN, MAX", () => {
      editColumnByName(
        "NC_STR_1",
        "NC_MATH_1",
        `CEILING(1.4) + FLOOR(1.6) + ROUND(2.5) + MOD({CityId}, 3) + MIN({CityId}, {CountryId}) + MAX({CityId}, {CountryId})`
      );
      rowValidation("NC_MATH_1", RESULT_MATH_1);
    });

    it("Formula: LOG, EXP, POWER, SQRT", () => {
      // if (!isXcdb()) {
      if (dbType === "mysql") {
        // SQLITE doesnt support LOG, EXP, POWER SQRT construct
        editColumnByName(
          "NC_MATH_1",
          "NC_MATH_2",
          `LOG({CityId}) + EXP({CityId}) + POWER({CityId}, 3) + SQRT({CountryId})`
        );
        rowValidation("NC_MATH_2", RESULT_MATH_2);
      }
    });

    it("Formula: NOW, EDIT & Delete column", () => {
      // if (!isXcdb()) editColumnByName("NC_MATH_2", "NC_NOW", `NOW()`);
      if (dbType === "mysql") editColumnByName("NC_MATH_2", "NC_NOW", `NOW()`);
      else editColumnByName("NC_MATH_1", "NC_NOW", `NOW()`);
      deleteColumnByName("NC_NOW");

      cy.closeTableTab("City");
    });

    it("Formula: Circular references", () => {
      cy.openTableTab("City", 25);

      addFormulaBasedColumn(
        "NC_CIRC_REF_0",
        "{City}"
      );
      addFormulaBasedColumn(
        "NC_CIRC_REF_1",
        "{NC_CIRC_REF_0}"
      );
      editCircularColumnByName(
        "NC_CIRC_REF_0",
        "{NC_CIRC_REF_1}"
      );

      deleteColumnByName("NC_CIRC_REF_1");
      deleteColumnByName("NC_CIRC_REF_0");

      cy.closeTableTab("City");
    });

    it("Formula: Duplicated dependencies (neighbours)", () => {
      cy.openTableTab("City", 25);

      addFormulaBasedColumn(
        "NC_CIRC_REF_0",
        "{City}"
      );
      addFormulaBasedColumn(
        "NC_CIRC_REF_1",
        "{NC_CIRC_REF_0}"
      );
      addFormulaBasedColumn(
        "NC_CIRC_REF_2",
        "CONCAT({NC_CIRC_REF_1},{NC_CIRC_REF_1})"
      );

      rowValidation("NC_CIRC_REF_0", RESULT_CIRC_REF_0);
      rowValidation("NC_CIRC_REF_1", RESULT_CIRC_REF_1);
      rowValidation("NC_CIRC_REF_2", RESULT_CIRC_REF_2);

      editColumnByName(
        "NC_CIRC_REF_0",
        "NC_CIRC_REF_0",
        "CONCAT({City},{City})"
      );

      rowValidation("NC_CIRC_REF_0", RESULT_CIRC_REF_0_FINAL);
      rowValidation("NC_CIRC_REF_2", RESULT_CIRC_REF_2_FINAL);

      deleteColumnByName("NC_CIRC_REF_2");
      deleteColumnByName("NC_CIRC_REF_1");
      deleteColumnByName("NC_CIRC_REF_0");

      cy.closeTableTab("City");
    });
  });
};

/**
 * @copyright Copyright (c) 2021, Xgene Cloud Ltd
 *
 * @author Pranav C Balan <pranavxc@gmail.com>
 * @author Raju Udava <sivadstala@gmail.com>
 * @author Wing-Kam Wong <wingkwong.code@gmail.com>
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
