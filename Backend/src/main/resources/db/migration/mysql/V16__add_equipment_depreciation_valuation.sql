-- Equipment depreciation & valuation (issue #702).
--
-- Adds the finance fields the valuation feature needs: purchase price, depreciable life in
-- years, and the depreciation method (straight line by default). All three are nullable -
-- an asset registered before the feature landed, or one where finance data was never entered,
-- simply accrues no depreciation (book value = cost) rather than blocking registration.
--
-- The derived figures (book value, accumulated depreciation, projected replacement cost) are
-- computed on read by Equipment.getBookValue() & co. and are never stored, so no columns for
-- them are needed here.

ALTER TABLE equipment ADD COLUMN purchase_cost DECIMAL(14, 2) NULL;
ALTER TABLE equipment ADD COLUMN useful_life_years INT NULL;
ALTER TABLE equipment ADD COLUMN depreciation_method VARCHAR(30) NULL;

UPDATE equipment SET depreciation_method = 'STRAIGHT_LINE' WHERE depreciation_method IS NULL;
