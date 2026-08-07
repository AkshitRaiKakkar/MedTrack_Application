package com.medtrack.model;

/**
 * Level of a node in the facility location tree (issue #745).
 *
 * <p>The hierarchy runs {@code FACILITY → FLOOR → WING → ROOM/STORAGE}. A WING represents a
 * ward/zone of a floor, and ROOM a room or dedicated treatment/storage area; STORAGE is the
 * storage-area flavour of the same final level.</p>
 */
public enum LocationType {
    FACILITY,
    FLOOR,
    WING,
    ROOM,
    STORAGE
}