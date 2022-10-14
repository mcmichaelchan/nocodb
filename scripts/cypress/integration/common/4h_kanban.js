import { mainPage } from "../../support/page_objects/mainPage";
import {
  isTestSuiteActive,
  isXcdb,
} from "../../support/page_objects/projectConstants";
import { loginPage } from "../../support/page_objects/navigation";

// kanban grouping field configuration
//
function configureGroupingField(field, closeMenu = true) {
  cy.get(".nc-kanban-stacked-by-menu-btn").click();

  cy.getActiveMenu(".nc-dropdown-kanban-stacked-by-menu")
    .should("exist")
    .find(".nc-kanban-grouping-field-select")
    .click();
  cy.get(".ant-select-dropdown:visible")
    .should("exist")
    .find(`.ant-select-item`)
    .contains(new RegExp("^" + field + "$", "g"))
    .should("exist")
    .click();

  if (closeMenu) {
    cy.get(".nc-kanban-stacked-by-menu-btn").click();
  }

  cy.get(".nc-kanban-stacked-by-menu-btn")
    .contains(`Stacked By ${field}`)
    .should("exist");
}

// number of kanban stacks altogether
//
function verifyKanbanStackCount(count) {
  cy.get(".nc-kanban-stack").should("have.length", count);
}

// order of kanban stacks
//
function verifyKanbanStackOrder(order) {
  cy.get(".nc-kanban-stack").each(($el, index) => {
    cy.wrap($el).should("contain", order[index]);
  });
}

// kanban stack footer numbers
//
function verifyKanbanStackFooterCount(count) {
  cy.get(".nc-kanban-stack").each(($el, index) => {
    cy.wrap($el)
      .scrollIntoView()
      .find(".nc-kanban-data-count")
      .should(
        "contain",
        `${count[index]} record${count[index] !== 1 ? "s" : ""}`
      );
  });
}

// kanban card count in a stack
//
function verifyKanbanStackCardCount(count) {
  cy.get(".nc-kanban-stack").each(($el, index) => {
    if (count[index] > 0) {
      cy.wrap($el)
        .find(".nc-kanban-item")
        .should("exist")
        .should("have.length", count[index]);
    }
  });
}

// order of cards within a stack
//
function verifyKanbanStackCardOrder(order, stackIndex, cardIndex) {
  cy.get(".nc-kanban-stack")
    .eq(stackIndex)
    .find(".nc-kanban-item")
    .eq(cardIndex)
    .should("contain", order);
}

// drag drop kanban card
//
function dragAndDropKanbanCard(srcCard, dstCard) {
  cy.get(`.nc-kanban-item .ant-card :visible:contains("${srcCard}")`).drag(
    `.nc-kanban-item :visible:contains("${dstCard}")`
  );
}

// drag drop kanban stack
//
function dragAndDropKanbanStack(srcStack, dstStack) {
  cy.get(`.nc-kanban-stack-head :contains("${srcStack}")`).drag(
    `.nc-kanban-stack-head :contains("${dstStack}")`
  );
}

let localDebug = false;

function addOption(index, value) {
  cy.getActiveMenu(".nc-dropdown-edit-column")
    .find(".ant-btn-dashed")
    .should("exist")
    .click();
  cy.get(".nc-dropdown-edit-column .nc-select-option").should(
    "have.length",
    index
  );
  cy.get(".nc-dropdown-edit-column .nc-select-option")
    .last()
    .find("input")
    .click()
    .type(value);
}

function editColumn() {
  cy.get(`[data-title="Rating"]`).first().scrollIntoView();

  cy.get(`th:contains("Rating") .nc-icon.ant-dropdown-trigger`)
    .trigger("mouseover", { force: true })
    .click({ force: true });

  cy.getActiveMenu(".nc-dropdown-column-operations")
    .find(".nc-column-edit")
    .click();

  cy.inputHighlightRenderWait();

  // change column type and verify
  cy.getActiveMenu(".nc-dropdown-edit-column")
    .find(".nc-column-type-input")
    .last()
    .click()
    .type("SingleSelect");
  cy.getActiveSelection(".nc-dropdown-column-type")
    .find(".ant-select-item-option")
    .contains("SingleSelect")
    .click();
  cy.inputHighlightRenderWait();

  addOption(1, "G");
  addOption(2, "PG");
  addOption(3, "PG-13");
  addOption(4, "R");
  addOption(5, "NC-17");

  cy.getActiveMenu(".nc-dropdown-edit-column")
    .find(".ant-btn-primary:visible")
    .contains("Save")
    .click();

  cy.toastWait("Column updated");
}

// test suite
//
export const genTest = (apiType, dbType) => {
  if (!isTestSuiteActive(apiType, dbType)) return;

  let clear;

  describe(`${apiType.toUpperCase()} api - Kanban`, () => {
    before(() => {
      cy.restoreLocalStorage();

      if (dbType === "postgres" || dbType === "xcdb") {
        cy.openTableTab("Film", 25);

        if (dbType === "postgres") {
          // delete SQL views
          cy.deleteTable("NicerButSlowerFilmList");
          cy.deleteTable("FilmList");
        }

        // edit `rating` column: from custom DB type to single select
        editColumn();
        cy.closeTableTab("Film");
      }

      clear = Cypress.LocalStorage.clear;
      Cypress.LocalStorage.clear = () => {};
    });

    // beforeEach(() => {
    //   cy.restoreLocalStorage();
    // });
    //
    // afterEach(() => {
    //   cy.saveLocalStorage();
    // });

    after(() => {
      Cypress.LocalStorage.clear = clear;
      cy.saveLocalStorage();
    });

    /**
     class name specific to kanban view
     .nc-kanban-stacked-by-menu-btn
     .nc-dropdown-kanban-stacked-by-menu
     .nc-kanban-add-edit-stack-menu-btn
     .nc-dropdown-kanban-add-edit-stack-menu
     .nc-kanban-grouping-field-select
     .nc-dropdown-kanban-stack-context-menu
     **/

    it("Create Kanban view", () => {
      if (localDebug === false) {
        cy.openTableTab("Film", 25);
        cy.viewCreate("kanban");
      }
    });

    it("Rename Kanban view", () => {
      cy.viewRename("kanban", 0, "Film Kanban");
    });

    it("Configure grouping field", () => {
      configureGroupingField("Rating", true);
    });

    it("Verify kanban stacks", () => {
      verifyKanbanStackCount(6);
      verifyKanbanStackOrder([
        "uncategorized",
        "G",
        "PG",
        "PG-13",
        "R",
        "NC-17",
      ]);
      verifyKanbanStackFooterCount([0, 178, 194, 223, 195, 210]);
      verifyKanbanStackCardCount([0, 25, 25, 25, 25, 25]);
    });

    it("Hide fields", () => {
      mainPage.hideAllColumns();
      mainPage.unhideField("Title", "kanban");

      verifyKanbanStackCardCount([0, 25, 25, 25, 25, 25]);
    });

    it("Verify card order", () => {
      // verify 3 cards from each stack
      verifyKanbanStackCardOrder("ACE GOLDFINGER", 1, 0);
      verifyKanbanStackCardOrder("AFFAIR PREJUDICE", 1, 1);
      verifyKanbanStackCardOrder("AFRICAN EGG", 1, 2);

      verifyKanbanStackCardOrder("ACADEMY DINOSAUR", 2, 0);
      verifyKanbanStackCardOrder("AGENT TRUMAN", 2, 1);
      verifyKanbanStackCardOrder("ALASKA PHANTOM", 2, 2);

      verifyKanbanStackCardOrder("AIRPLANE SIERRA", 3, 0);
      verifyKanbanStackCardOrder("ALABAMA DEVIL", 3, 1);
      verifyKanbanStackCardOrder("ALTER VICTORY", 3, 2);

      verifyKanbanStackCardOrder("AIRPORT POLLOCK", 4, 0);
      verifyKanbanStackCardOrder("ALONE TRIP", 4, 1);
      verifyKanbanStackCardOrder("AMELIE HELLFIGHTERS", 4, 2);

      verifyKanbanStackCardOrder("ADAPTATION HOLES", 5, 0);
      verifyKanbanStackCardOrder("ALADDIN CALENDAR", 5, 1);
      verifyKanbanStackCardOrder("ALICE FANTASIA", 5, 2);
    });

    it.skip("Verify inter-stack drag and drop", () => {
      dragAndDropKanbanCard("ACE GOLDFINGER", "ACADEMY DINOSAUR");
      verifyKanbanStackCardOrder("AFFAIR PREJUDICE", 1, 0);
      verifyKanbanStackCardOrder("ACE GOLDFINGER", 2, 0);
      verifyKanbanStackCardOrder("ACADEMY DINOSAUR", 2, 1);

      dragAndDropKanbanCard("ACE GOLDFINGER", "AFFAIR PREJUDICE");
      verifyKanbanStackCardOrder("ACE GOLDFINGER", 1, 0);
      verifyKanbanStackCardOrder("AFFAIR PREJUDICE", 1, 1);
      verifyKanbanStackCardOrder("ACADEMY DINOSAUR", 2, 0);
    });

    it.skip("Verify intra-stack drag and drop", () => {
      dragAndDropKanbanCard("ACE GOLDFINGER", "AFFAIR PREJUDICE");
      verifyKanbanStackCardOrder("AFFAIR PREJUDICE", 1, 0);
      verifyKanbanStackCardOrder("ACE GOLDFINGER", 1, 1);

      dragAndDropKanbanCard("ACE GOLDFINGER", "AFFAIR PREJUDICE");
      verifyKanbanStackCardOrder("ACE GOLDFINGER", 1, 0);
      verifyKanbanStackCardOrder("AFFAIR PREJUDICE", 1, 1);
    });

    it("Verify stack drag drop", () => {
      verifyKanbanStackOrder([
        "uncategorized",
        "G",
        "PG",
        "PG-13",
        "R",
        "NC-17",
      ]);
      dragAndDropKanbanStack("PG-13", "R");
      verifyKanbanStackOrder([
        "uncategorized",
        "G",
        "PG",
        "R",
        "PG-13",
        "NC-17",
      ]);
      dragAndDropKanbanStack("PG-13", "R");
      verifyKanbanStackOrder([
        "uncategorized",
        "G",
        "PG",
        "PG-13",
        "R",
        "NC-17",
      ]);
    });

    it("Verify Sort", () => {
      mainPage.sortField("Title", "Z → A");
      verifyKanbanStackCardOrder("YOUNG LANGUAGE", 1, 0);
      verifyKanbanStackCardOrder("WEST LION", 1, 1);
      verifyKanbanStackCardOrder("WORST BANGER", 2, 0);
      verifyKanbanStackCardOrder("WORDS HUNTER", 2, 1);

      mainPage.clearSort();
      verifyKanbanStackCardOrder("ACE GOLDFINGER", 1, 0);
      verifyKanbanStackCardOrder("AFFAIR PREJUDICE", 1, 1);
      verifyKanbanStackCardOrder("ACADEMY DINOSAUR", 2, 0);
      verifyKanbanStackCardOrder("AGENT TRUMAN", 2, 1);
    });

    it("Verify Filter", () => {
      mainPage.filterField("Title", "is like", "BA");
      verifyKanbanStackCardOrder("BAKED CLEOPATRA", 1, 0);
      verifyKanbanStackCardOrder("BALLROOM MOCKINGBIRD", 1, 1);
      verifyKanbanStackCardOrder("ARIZONA BANG", 2, 0);
      verifyKanbanStackCardOrder("EGYPT TENENBAUMS", 2, 1);

      mainPage.filterReset();
      verifyKanbanStackCardOrder("ACE GOLDFINGER", 1, 0);
      verifyKanbanStackCardOrder("AFFAIR PREJUDICE", 1, 1);
      verifyKanbanStackCardOrder("ACADEMY DINOSAUR", 2, 0);
      verifyKanbanStackCardOrder("AGENT TRUMAN", 2, 1);
    });

    // it("Stack context menu- rename stack", () => {
    //   verifyKanbanStackCount(6);
    //   cy.get('.nc-kanban-stack-head').eq(1).find('.ant-dropdown-trigger').click();
    //   cy.getActiveMenu('.nc-dropdown-kanban-stack-context-menu').should('be.visible');
    //   cy.getActiveMenu('.nc-dropdown-kanban-stack-context-menu')
    //     .find('.ant-dropdown-menu-item')
    //     .contains('Rename Stack')
    //     .click();
    // })

    it("Stack context menu- delete stack", () => {});

    it("Stack context menu- collapse stack", () => {});

    it("Copy view", () => {
      mainPage.sortField("Title", "Z → A");
      mainPage.filterField("Title", "is like", "BA");

      cy.viewCopy(1);

      // verify copied view
      cy.get(".nc-kanban-stacked-by-menu-btn")
        .contains(`Stacked By Rating`)
        .should("exist");
      verifyKanbanStackCount(6);
      verifyKanbanStackOrder([
        "uncategorized",
        "G",
        "PG",
        "PG-13",
        "R",
        "NC-17",
      ]);
      verifyKanbanStackFooterCount([0, 4, 5, 8, 6, 6]);
      verifyKanbanStackCardOrder("BAREFOOT MANCHURIAN", 1, 0);
      verifyKanbanStackCardOrder("WORST BANGER", 2, 0);

      cy.viewDelete(1);
    });

    it("Add stack", () => {
      cy.viewOpen("kanban", 0);
      cy.get(".nc-kanban-add-edit-stack-menu-btn").should("exist").click();
      cy.getActiveMenu(".nc-dropdown-kanban-add-edit-stack-menu").should(
        "be.visible"
      );
      cy.getActiveMenu(".nc-dropdown-kanban-add-edit-stack-menu")
        .find(".ant-btn-dashed")
        .click();
      cy.getActiveMenu(".nc-dropdown-kanban-add-edit-stack-menu")
        .find(".nc-select-option")
        .last()
        .click()
        .type("Test{enter}");
      verifyKanbanStackCount(7);
      verifyKanbanStackOrder([
        "uncategorized",
        "G",
        "PG",
        "PG-13",
        "R",
        "NC-17",
        "Test",
      ]);
    });

    it("Collapse stack", () => {
      cy.get(".nc-kanban-stack-head").last().scrollIntoView();
      cy.get(".nc-kanban-stack-head").last().click();
      cy.getActiveMenu(".nc-dropdown-kanban-stack-context-menu").should(
        "be.visible"
      );

      // collapse stack
      cy.getActiveMenu(".nc-dropdown-kanban-stack-context-menu")
        .find(".ant-dropdown-menu-item")
        .contains("Collapse Stack")
        .click();
      cy.get(".nc-kanban-collapsed-stack")
        .should("exist")
        .should("have.length", 1);

      // expand back
      cy.get(".nc-kanban-collapsed-stack").click();
      cy.get(".nc-kanban-collapsed-stack").should("not.exist");
    });

    it("Add record to stack", () => {
      mainPage.hideAllColumns();
      mainPage.toggleShowSystemFields();
      mainPage.unhideField("LanguageId", "kanban");
      mainPage.unhideField("Title", "kanban");

      mainPage.filterReset();
      mainPage.clearSort();

      // skip for xcdb: many mandatory fields
      if (!isXcdb()) {
        cy.get(".nc-kanban-stack-head").last().scrollIntoView();
        cy.get(".nc-kanban-stack-head").last().click();
        cy.getActiveMenu(".nc-dropdown-kanban-stack-context-menu").should(
          "be.visible"
        );

        // add record
        cy.getActiveMenu(".nc-dropdown-kanban-stack-context-menu")
          .find(".ant-dropdown-menu-item")
          .contains("Add new record")
          .click();

        cy.getActiveDrawer(".nc-drawer-expanded-form").should("be.visible");
        cy.get(".nc-expand-col-Title")
          .find(".nc-cell > input")
          .should("exist")
          .first()
          .clear()
          .type("New record");
        cy.get(".nc-expand-col-LanguageId")
          .find(".nc-cell > input")
          .should("exist")
          .first()
          .clear()
          .type("1");

        cy.getActiveDrawer(".nc-drawer-expanded-form")
          .find("button")
          .contains("Save row")
          .click();
        cy.toastWait("updated successfully");
        cy.get("body").type("{esc}");

        // verify if the new record is in the stack
        verifyKanbanStackCount(7);
        verifyKanbanStackOrder([
          "uncategorized",
          "G",
          "PG",
          "PG-13",
          "R",
          "NC-17",
          "Test",
        ]);
        verifyKanbanStackCardCount([0, 25, 25, 25, 25, 25, 1]);
      }

      mainPage.toggleShowSystemFields();
    });

    it("Expand record", () => {
      // mainPage.toggleShowSystemFields();
      // mainPage.showAllColumns();

      cy.get(".nc-kanban-stack").eq(1).find(".nc-kanban-item").eq(0).click();
      cy.get(".nc-expand-col-Title")
        .find(".nc-cell > input")
        .then(($el) => {
          expect($el[0].value).to.have.string("ACE GOLDFINGER");
        });
      cy.get("body").type("{esc}");
    });

    it("Stack context menu- delete stack", () => {
      if (!isXcdb()) {
        cy.get(".nc-kanban-stack-head").last().scrollIntoView();
        cy.get(".nc-kanban-stack-head").last().click();
        cy.getActiveMenu(".nc-dropdown-kanban-stack-context-menu").should(
          "be.visible"
        );
        cy.getActiveMenu(".nc-dropdown-kanban-stack-context-menu")
          .find(".ant-dropdown-menu-item")
          .contains("Delete Stack")
          .click();
        cy.getActiveModal(".nc-modal-kanban-delete-stack").should("be.visible");
        cy.getActiveModal(".nc-modal-kanban-delete-stack")
          .find(".ant-btn-primary")
          .click();
        verifyKanbanStackCount(6);
        verifyKanbanStackOrder([
          "uncategorized",
          "G",
          "PG",
          "PG-13",
          "R",
          "NC-17",
        ]);
        verifyKanbanStackCardCount([1, 25, 25, 25, 25, 25]);
      }
    });

    it("Delete Kanban view", () => {
      cy.viewDelete(0);
      cy.closeTableTab("Film");
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
