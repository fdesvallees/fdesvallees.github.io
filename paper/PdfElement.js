/*
 * Paper.js - The Swiss Army Knife of Vector Graphics Scripting.
 * http://paperjs.org/
 *
 * Copyright (c) 2011 - 2020, Jürg Lehni & Jonathan Puckey
 * http://juerglehni.com/ & https://puckey.studio/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name PdfElement
 * @namespace
 * @private
 */
var PdfElement = new function() {
 
    function create(tag, attributes, formatter) {
    }

    function get(node, name) {
    }

    function set(node, attributes, formatter) {
        return node;
    }

    return /** @lends PdfElement */{
        // Export namespaces

        // Methods
        create: create,
        get: get,
        set: set
    };
};
