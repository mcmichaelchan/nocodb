import { mainPage } from "../../support/page_objects/mainPage";
import { isTestSuiteActive } from "../../support/page_objects/projectConstants";
import { loginPage } from "../../support/page_objects/navigation";

let storedURL = "";
let linkText = "";

const generateLinkWithPwd = () => {
  mainPage.shareView().click();
  cy.getActiveModal(".nc-modal-share-view")
    .find(".ant-modal-title")
    .contains("This view is shared via a private link")
    .should("be.visible");

  // enable checkbox & feed pwd, save
  cy.get('[data-cy="nc-modal-share-view__with-password"]').click();
  cy.get('[data-cy="nc-modal-share-view__password"]').clear().type('1')
  cy.get('[data-cy="nc-modal-share-view__save-password"]').click();
  cy.toastWait("Successfully updated");

  // copy link text, visit URL
  cy.get('[data-cy="nc-modal-share-view__link"]').then(($el) => {
    linkText = $el.text();
    // todo: visit url?
    cy.log(linkText);
  })
};

export const genTest = (apiType, dbType) => {
  if (!isTestSuiteActive(apiType, dbType)) return;

  describe(`${apiType.toUpperCase()} api - Shared VIEWs (GRID)`, () => {
    // Run once before test- create project (rest/graphql)
    //
    before(() => {
      cy.restoreLocalStorage();
      cy.openTableTab("City", 25);
    });

    beforeEach(() => {
      cy.restoreLocalStorage();
    });

    afterEach(() => {
      cy.saveLocalStorage();
    });

    after(() => {
      cy.restoreLocalStorage();
      cy.closeTableTab("City");
      cy.saveLocalStorage();
    });

    it("Generate link with password", () => {
      // store base URL- to re-visit and delete form view later
      cy.url().then((url) => {
        storedURL = url;
      });
      generateLinkWithPwd();

      cy.signOut();
    });

    it("Share view with incorrect password", () => {
      cy.visit(linkText, {
        baseUrl: null,
      });

      cy.getActiveModal(".nc-modal-shared-view-password-dlg").should("exist");

      // feed password
      cy.getActiveModal(".nc-modal-shared-view-password-dlg")
        .find('input[type="password"]')
        .clear()
        .type("a");
      cy.getActiveModal(".nc-modal-shared-view-password-dlg")
        .find('button:contains("Unlock")')
        .click();

      // if pwd is incorrect, active modal requesting to feed in password again will persist
      cy.getActiveModal(".nc-modal-shared-view-password-dlg")
        .find('button:contains("Unlock")')
        .should("exist");
    });

    // fallover test- use previously opened view & continue verification instead of opening again
    it("Share view with correct password", () => {
      // feed password
      cy.getActiveModal(".nc-modal-shared-view-password-dlg")
        .find('input[type="password"]')
        .clear()
        .type("1");
      cy.getActiveModal(".nc-modal-shared-view-password-dlg")
        .find('button:contains("Unlock")')
        .click();

      // if pwd is incorrect, active modal requesting to feed in password again will persist
      // cy.getActiveModal().find('button:contains("Unlock")').should('not.exist');
      // cy.get(".ant-modal-content:visible").should("not.exist")

      cy.wait(1000);

      // Verify Download as CSV is here
      mainPage.downloadCsv().should("exist");
      cy.get(".nc-actions-menu-btn").should("exist").click();

      mainPage.downloadExcel().should("exist");
      cy.get(".nc-actions-menu-btn").should("exist").click();
    });

    it("Delete view", () => {
      loginPage.loginAndOpenProject(apiType, dbType);
      cy.openTableTab("City", 25);

      // wait for page load to complete
      cy.get(".nc-grid-row").should("have.length", 25);
      mainPage.deleteCreatedViews();
    });
  });
};

/**
 * @copyright Copyright (c) 2021, Xgene Cloud Ltd
 *
 * @author Pranav C Balan <pranavxc@gmail.com>
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
