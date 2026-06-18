# TODO

## Incident type aware map markers

- [x] Create centralized helper `src/utils/incidentType.js` with `determineIncidentType(result)` rules

- [x] Update `src/pages/LiveMapView.jsx` to use helper for marker `type` (no hardcoding)

- [x] Update details panel to show: Category, Accident Class, Traffic Class, Confidence values, Location

- [x] Add detected-category badge in details panel (CSS if needed in `src/styles/live-map.css`)

- [x] Verify marker classes map correctly via `type.toLowerCase()` (Accident/Congestion/Violation)

- [x] Verify filters (All/Accident/Congestion/Violation) work with new `type`


