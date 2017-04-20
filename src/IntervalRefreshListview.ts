import * as dojoDeclare from "dojo/_base/declare";
import * as WidgetBase from "mxui/widget/_WidgetBase";
import * as domConstruct from "dojo/dom-construct";
import * as domClass from "dojo/dom-class";
import * as registry from "dijit/registry";

import "./ui/IntervalRefreshListview.css";

interface ListView extends mxui.widget._WidgetBase {
    _loadData: (callback: () => void) => void;
    connectedIntervalRefreshListview?: string;
}

class IntervalRefreshListview extends WidgetBase {
    targetName: string;
    refreshInterval: number;
    allowRefreshAttribute: string;

    private targetWidget: ListView;
    private targetNode: HTMLElement | null;
    private timerHandle: number;
    private isSetup: boolean;
    private isRunning: boolean;
    private allowRefresh: boolean;
    private contextObject: mendix.lib.MxObject;
    postCreate() {
        this.isRunning = false;
        this.allowRefresh = true;
        this.isSetup = false;
        this.targetNode = this.findTargetNode(this.targetName, this.domNode);
        if (this.targetNode) {
            this.targetWidget = registry.byNode(this.targetNode);
            if (this.isValidWidget(this.targetWidget)) {
                domClass.add(this.targetNode, "widget-refresh-interval-listview");
                this.isSetup = true;
                // Startup if when allow refresh is not relevant, else wait for update;
                if (!this.allowRefreshAttribute) {
                    this.startRefreshing();
                }
            }
        }
    }

    update(contextObject: mendix.lib.MxObject, callback?: () => void ) {
        this.contextObject = contextObject;
        this.resetSubscription(contextObject);

        if (contextObject && this.allowRefreshAttribute) {
            this.updateRefresh();
        } else if (this.allowRefreshAttribute) {
            this.stopRefreshing();

        }
        if (callback) callback();
    }

    uninitialize(): boolean {
        this.stopRefreshing();

        return true;
    }

    private updateRefresh() {
        const allow = this.contextObject.get(this.allowRefreshAttribute) as boolean;
        if (allow) {
            this.startRefreshing();
        } else {
            this.stopRefreshing();
        }
    }

    private startRefreshing() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.setInterval();
        }
    }

    private stopRefreshing() {
        this.isRunning = false;
        if (this.timerHandle) {
            window.clearInterval(this.timerHandle);
        }
    }

    private resetSubscription(mxObject: mendix.lib.MxObject) {
        this.unsubscribeAll();
        if (mxObject) {
            this.subscribe({
                callback: () => this.updateRefresh(),
                guid: mxObject.getGuid()
            });
            this.subscribe({
                attr: this.allowRefreshAttribute,
                callback: () => this.updateRefresh(),
                guid: mxObject.getGuid()
            });
        }
    }

    private findTargetNode(targetName: string, domNode: HTMLElement): HTMLElement | null {
        let queryNode = domNode.parentNode as HTMLElement;
        let targetNode: HTMLElement | null = null;
        while (!targetNode) {
            targetNode = queryNode.querySelector(`.mx-name-${targetName}`) as HTMLElement;
            if (window.document.isEqualNode(queryNode)) break;
            queryNode = queryNode.parentNode as HTMLElement;
        }

        if (!targetNode) {
            this.renderAlert(`Unable to find listview with the name "${targetName}"`);
        }

        return targetNode;
    }

    private isValidWidget(targetWidget: ListView): boolean {
        if (targetWidget && targetWidget.declaredClass === "mxui.widget.ListView") {
            if (targetWidget._loadData) {
                if (!targetWidget.connectedIntervalRefreshListview) {
                    targetWidget.connectedIntervalRefreshListview = this.id;
                    return true;
                } else {
                    this.renderAlert(`Target name "${this.targetName}" is already associated `
                        + `to widget ${targetWidget.connectedIntervalRefreshListview}`);
                }
            } else {
                this.renderAlert("This Mendix version is incompatible with the auto load more widget");
            }
        } else {
            this.renderAlert(`Supplied target name "${this.targetName}" is not of the type listview`);
        }

        return false;
    }

    private setInterval() {
        this.timerHandle = window.setTimeout(() => {
            this.targetWidget._loadData(() => this.setInterval());
        }, this.refreshInterval);
    }

    private renderAlert(message: string) {
        domConstruct.place(
            `<div class='alert alert-danger widget-auto-load-more-alert'>${message}</div>`,
            this.domNode,
            "only"
        );
    }
}

// Declare widget prototype the Dojo way
// Thanks to https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/dojo/README.md
// tslint:disable : only-arrow-functions
dojoDeclare("IntervalRefreshListview.widget.IntervalRefreshListview",
    [ WidgetBase ], function(Source: any) {
    const result: any = {};
    for (const property in Source.prototype) {
        if (property !== "constructor" && Source.prototype.hasOwnProperty(property)) {
            result[property] = Source.prototype[property];
        }
    }
    return result;
}(IntervalRefreshListview));
