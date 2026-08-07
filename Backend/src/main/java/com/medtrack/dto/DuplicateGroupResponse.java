package com.medtrack.dto;

import com.medtrack.model.Equipment;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * A reconciled group of assets that are likely the same physical device registered more than once
 * (issue #746). The UI presents the group side by side and lets the user choose which to keep and
 * which to merge away.
 */
@Data
@Builder
public class DuplicateGroupResponse {
    private String matchedOn;
    private List<Equipment> assets;

    public int size() {
        return assets == null ? 0 : assets.size();
    }
}