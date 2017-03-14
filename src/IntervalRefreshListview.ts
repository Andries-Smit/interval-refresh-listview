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

    private targetWidget: ListView;
    private targetNode: HTMLElement | null;
    private timerHandle: number;

    postCreate() {
        this.targetNode = this.findTargetNode(this.targetName, this.domNode);
        if (this.targetNode) {
            this.targetWidget = registry.byNode(this.targetNode);
            if (this.isValidWidget(this.targetWidget)) {
                domClass.add(this.targetNode, "widget-refresh-interval-listview");
                this.setInterval();
            }
        }
    }

    uninitialize(): boolean {
        if (this.timerHandle) {
            window.clearInterval(this.timerHandle);
        }

        return true;
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
dojoDeclare("org.flockofbirds.widget.intervalrefreshlistview.IntervalRefreshListview",
    [ WidgetBase ], function(Source: any) {
    const result: any = {};
    for (const property in Source.prototype) {
        if (property !== "constructor" && Source.prototype.hasOwnProperty(property)) {
            result[property] = Source.prototype[property];
        }
    }
    return result;
}(IntervalRefreshListview));
