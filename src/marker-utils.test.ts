/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { MarkerUtils } from "./marker-utils";
import { initialize, LatLng } from "@googlemaps/jest-mocks";

initialize();
const markerClasses = [
  google.maps.Marker,
  google.maps.marker.AdvancedMarkerElement,
];

describe.each(markerClasses)(
  "MarkerUtils works with legacy and Advanced Markers",
  (markerClass) => {
    let map: google.maps.Map;

    beforeEach(() => {
      map = new google.maps.Map(document.createElement("div"));
    });

    test("identifies AdvancedMarker instances", () => {
      const isAdvancedMarker = MarkerUtils.isAdvancedMarker(new markerClass());
      if (markerClass === google.maps.marker.AdvancedMarkerElement) {
        expect(isAdvancedMarker).toBeTruthy;
        return;
      }
      expect(isAdvancedMarker).toBeFalsy;
    });

    test("sets the map", () => {
      const marker = new markerClass();
      MarkerUtils.setMap(marker, map);
      if (markerClass === google.maps.marker.AdvancedMarkerElement) {
        expect(
          (marker as google.maps.marker.AdvancedMarkerElement).map
        ).toEqual(map);
        return;
      }
      expect((marker as google.maps.Marker).setMap).toHaveBeenCalled;
    });

    test("gets the marker position and returns a LatLng", () => {
      const createLatLngSpy = jest.fn();
      google.maps.LatLng = class extends google.maps.LatLng {
        private mockLat: number;
        private mockLng: number;
        constructor(...args: ConstructorParameters<typeof google.maps.LatLng>) {
          super(...args);
          createLatLngSpy(...args);
          this.mockLat = args[0] !== undefined ? +args[0] : NaN;
          this.mockLng = args[1] !== undefined ? +args[1] : NaN;
        }
        public lat = () => this.mockLat;
        public lng = () => this.mockLng;
      };

      // test markers created with LatLng and LatLngLiteral
      [
        new google.maps.LatLng(1, 1),
        { lat: 1, lng: 1 },
        { lat: 0, lng: 0 },
        { lat: undefined, lng: undefined },
      ].forEach((position) => {
        const marker = new markerClass({ position: position });
        if (markerClass === google.maps.marker.AdvancedMarkerElement) {
          (marker as google.maps.marker.AdvancedMarkerElement).position =
            position;
        }
        const markerPosition = MarkerUtils.getPosition(marker);

        expect(markerPosition).toBeInstanceOf(LatLng);
        expect(markerPosition.lat()).not.toEqual(NaN);
        expect(markerPosition.lng()).not.toEqual(NaN);
      });
    });

    test("", () => {
      const marker = new markerClass();
      expect(MarkerUtils.getVisible(marker)).toBeTruthy;
    });
  }
);
