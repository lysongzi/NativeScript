﻿import * as view from "ui/core/view";
import * as frame from "ui/frame";
import * as page from "ui/page";
import * as stackLayoutModule from "ui/layouts/stack-layout";
import * as button from "ui/button";
import * as TKUnit from "../TKUnit";
import * as utils from "utils/utils";
import * as platform from "platform";
import * as colorModule from "color";
import * as formattedStringModule from "text/formatted-string";
import * as spanModule from "text/span";
import { ActionBar } from "ui/action-bar";
import { unsetValue } from "ui/core/view";
import { Color } from "color";

var DELTA = 0.1;

export var ASYNC = 0.2;
export var MEMORY_ASYNC = 2;

export function getColor(uiColor: UIColor): Color {
    var redRef = new interop.Reference<number>();
    var greenRef = new interop.Reference<number>();
    var blueRef = new interop.Reference<number>();
    var alphaRef = new interop.Reference<number>();

    uiColor.getRedGreenBlueAlpha(redRef, greenRef, blueRef, alphaRef);
    var red = redRef.value * 255;
    var green = greenRef.value * 255;
    var blue = blueRef.value * 255;
    var alpha = alphaRef.value * 255;

    return new Color(alpha, red, green, blue);
}

function clearPage(): void {
    let newPage = getCurrentPage();
    if (!newPage) {
        throw new Error("NO CURRENT PAGE!!!!");
    }

    newPage.style.backgroundColor = unsetValue;
    newPage.style.color = unsetValue;
    newPage.bindingContext = unsetValue;
    newPage.className = unsetValue;
    newPage.id = unsetValue;
}

export function do_PageTest(test: (views: [page.Page, view.View, view.View, view.View, ActionBar]) => void, content: view.View, secondView: view.View, thirdView: view.View) {
    clearPage();
    let newPage = getCurrentPage();
    newPage.content = content;
    test([newPage, content, secondView, thirdView, newPage.actionBar]);
    newPage.content = null;
}

export function do_PageTest_WithButton(test: (views: [page.Page, button.Button, ActionBar]) => void) {
    clearPage();
    let newPage = getCurrentPage();
    let btn = new button.Button();
    newPage.content = btn;
    test([newPage, btn, newPage.actionBar]);
    newPage.content = null;
}

export function do_PageTest_WithStackLayout_AndButton(test: (views: [page.Page, stackLayoutModule.StackLayout, button.Button, ActionBar]) => void) {
    clearPage();
    let newPage = getCurrentPage();
    let stackLayout = new stackLayoutModule.StackLayout();
    let btn = new button.Button();
    stackLayout.addChild(btn);
    newPage.content = stackLayout;
    test([newPage, stackLayout, btn, newPage.actionBar]);
    newPage.content = null;
}

//export function buildUIAndRunTest(controlToTest, testFunction, pageCss?, testDelay?) {
export function buildUIAndRunTest<T extends view.View>(controlToTest: T, testFunction: (views: [T, page.Page]) => void, pageCss?) {
    clearPage();
    let newPage = getCurrentPage();

    newPage.css = pageCss;
    newPage.content = controlToTest;

    testFunction([controlToTest, newPage]);
    newPage.content = null;
    newPage.css = null;
}

export function buildUIWithWeakRefAndInteract<T extends view.View>(createFunc: () => T, interactWithViewFunc?: (view: T) => void, done?) {
    clearPage();
    const page = getCurrentPage();
    const weakRef = new WeakRef(createFunc());
    page.content = weakRef.get();
    if (interactWithViewFunc) {
        interactWithViewFunc(weakRef.get());
    }
    page.content = null;
    // Give a change for native cleanup (e.g. keyboard close, etc.).
    TKUnit.wait(0.001);
    if (page.ios) {
        /* tslint:disable:no-unused-expression */
        // Could cause GC on the next call.
        // NOTE: Don't replace this with forceGC();
        new ArrayBuffer(4 * 1024 * 1024);
    }
    utils.GC();

    try {
        TKUnit.assert(!weakRef.get(), weakRef.get() + " leaked!");
        done(null);
    }
    catch (ex) {
        done(ex);
    }
}

export function navigateToModuleAndRunTest(moduleName, context, testFunction) {
    let page = navigateToModule(moduleName, context);
    testFunction(page);
}

export function navigate(pageFactory: () => page.Page, navigationContext?: any): page.Page {
    let entry: frame.NavigationEntry = { create: pageFactory, animated: false, context: navigationContext, clearHistory: true };
    return navigateWithEntry(entry);
}

export function navigateWithHistory(pageFactory: () => page.Page, navigationContext?: any): page.Page {
    let entry: frame.NavigationEntry = { create: pageFactory, animated: false, context: navigationContext, clearHistory: false };
    return navigateWithEntry(entry);
}

export function navigateToModule(moduleName: string, context?: any): page.Page {
    let entry: frame.NavigationEntry = { moduleName: moduleName, context: context, animated: false, clearHistory: true };
    return navigateWithEntry(entry);
}

export function getCurrentPage(): page.Page {
    return frame.topmost().currentPage;
}

export function getClearCurrentPage(): page.Page {
    let page = frame.topmost().currentPage;
    page.style.backgroundColor = unsetValue;
    page.style.color = unsetValue;
    page.bindingContext = unsetValue;
    page.className = unsetValue;
    page.id = unsetValue;
    return page;
}

export function waitUntilNavigatedFrom(oldPage: page.Page) {
    TKUnit.waitUntilReady(() => getCurrentPage() && getCurrentPage() !== oldPage);
}

export function navigateWithEntry(entry: frame.NavigationEntry): page.Page {
    let page = frame.resolvePageFromEntry(entry);
    entry.moduleName = null;
    entry.create = function () {
        return page;
    };

    let currentPage = getCurrentPage();
    frame.topmost().navigate(entry);
    waitUntilNavigatedFrom(currentPage);
    return page;
}

export function goBack() {
    let currentPage = getCurrentPage();
    frame.topmost().goBack();
    waitUntilNavigatedFrom(currentPage);
}

export function assertAreClose(actual: number, expected: number, message: string): void {
    const density = utils.layout.getDisplayDensity();
    const delta = Math.floor(density) !== density ? 1.1 : DELTA;

    TKUnit.assertAreClose(actual, expected, delta, message);
}

export function assertViewColor(testView: view.View, hexColor: string) {
    TKUnit.assert(testView.style.color, "Color property not applied correctly. Style value is not defined.");
    TKUnit.assertEqual(testView.style.color.hex, hexColor, "color property");
}

export function assertViewBackgroundColor(testView: view.ViewBase, hexColor: string) {
    TKUnit.assert(testView.style.backgroundColor, "Background color property not applied correctly. Style value is not defined.");
    TKUnit.assertEqual(testView.style.backgroundColor.hex, hexColor, "backgroundColor property");
}

export function forceGC() {
    if (platform.device.os === platform.platformNames.ios) {
        /* tslint:disable:no-unused-expression */
        // Could cause GC on the next call.
        new ArrayBuffer(4 * 1024 * 1024);
    }

    utils.GC();
    TKUnit.wait(0.001);
}

export function _generateFormattedString(): formattedStringModule.FormattedString {
    let formattedString = new formattedStringModule.FormattedString();
    let span: spanModule.Span;

    span = new spanModule.Span();
    span.fontFamily = "serif";
    span.fontSize = 10;
    span.fontWeight = "bold";
    span.color = new colorModule.Color("red");
    span.backgroundColor = new colorModule.Color("blue");
    span.textDecoration = "line-through";
    span.text = "Formatted";
    formattedString.spans.push(span);

    span = new spanModule.Span();
    span.fontFamily = "sans-serif";
    span.fontSize = 20;
    span.fontStyle = "italic";
    span.color = new colorModule.Color("green");
    span.backgroundColor = new colorModule.Color("yellow");
    span.textDecoration = "underline";
    span.text = "Text";
    formattedString.spans.push(span);

    return formattedString;
}