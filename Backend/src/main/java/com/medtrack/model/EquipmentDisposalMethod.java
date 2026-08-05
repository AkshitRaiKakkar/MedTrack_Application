package com.medtrack.model;

/**
 * The method by which a decommissioned medical asset leaves the organisation (issue #744).
 *
 * <p>Every disposal record must state one of these, so the certificate of disposal and the audit
 * trail document whether the asset was sold, scrapped, donated or handed back to its vendor.</p>
 */
public enum EquipmentDisposalMethod {
    SALE,
    SCRAP,
    DONATION,
    RETURN_TO_VENDOR
}
