import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

import * as MaplibreGrid from "maplibre-grid";
import "maplibre-gl/dist/maplibre-gl.css";

import dat from "dat.gui";
function Mapbox() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  useEffect(() => {
    function round(value) {
      return Math.floor(value * 10 ** 6) / 10 ** 6;
    }
    if (map.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style:
        "https://api.maptiler.com/maps/basic/style.json?key=Gi5DuPljk1VJKfbc2vfn", // maplibre-grid token
      center: [30, 40],
      zoom: 1.5,
    });
    map.current.on("load", () => {
      const grid1 = new MaplibreGrid.Grid({
        gridWidth: 0.1,
        gridHeight: 0.1,
        units: "kilometers",
        minZoom: 14,
        maxZoom: 22,
        active: true,
        paint: {
          "line-opacity": 0.2,
        },
      });

      map.current.addControl(grid1);
      const selectedCells = [];
      const info = document.getElementById("info");
      const updateInfo = () => {
        info.innerHTML = `
          Center: ${round(0.001)}, ${round(0.002)}<br>
          Zoom: ${round(map.current.getZoom())}
          <div class="divider"></div>
          Grid 1 active: ${grid1.active}<br>
          
          <div class="divider"></div>
          Selected cells: ${selectedCells.length}<br>
          <div class="grid-4">
            ${selectedCells
              .map((x) =>
                x.geometry.bbox.map((y) => `<span>${round(y)}</span>`)
              )
              .flat()
              .join("")}
          </div>
        `;
      };
      map.current.on("move", updateInfo);
      map.current.on("zoom", updateInfo);
      updateInfo();

      const maploadHandle = (e) => {
        const selectedCellsId = "selected-cells";
        map.current.addSource(selectedCellsId, {
          type: "geojson",
          data: { type: "FeatureCollection", features: selectedCells },
        });
        map.current.addLayer({
          id: selectedCellsId,
          source: selectedCellsId,
          active: true,
          type: "fill",
          paint: {
            "fill-color": "#0000ff",
            "fill-opacity": 0.2,
            "fill-outline-color": "transparent",
          },
        });
        map.current.on("grid.click", (event) => {
          console.log("event :", event);
          const bbox = event.bbox;
          console.log("bbox:", bbox);

          const cellIndex = selectedCells.findIndex(
            (x) => x.geometry.bbox.toString() === bbox.toString()
          );
          if (cellIndex === -1) {
            const coordinates = [
              [
                [bbox[0], bbox[1]],
                [bbox[2], bbox[1]],
                [bbox[2], bbox[3]],
                [bbox[0], bbox[3]],
                [bbox[0], bbox[1]],
              ],
            ];
            const cell = {
              type: "Feature",
              geometry: { type: "Polygon", bbox, coordinates },
            };
            selectedCells.push(cell);
            console.log("selectedcells", selectedCells);
          } else {
            selectedCells.splice(cellIndex, 1);
          }

          const source = map.current.getSource(selectedCellsId);
          source.setData({
            type: "FeatureCollection",
            features: selectedCells,
          });

          updateInfo();
        });
      };
      // select cell
      map.current.on("load", maploadHandle());
      map.current.on("click", maploadHandle());

      // GUI
      const grid1GuiConfig = { enabled: true };

      const updateGrid = (grid, gridGuiConfig) => {
        if (gridGuiConfig.enabled) {
          if (!map.current.hasControl(grid)) {
            map.addControl(grid);
          } else {
            grid.update();
          }
        } else {
          if (map.current.hasControl(grid)) {
            map.current.removeControl(grid);
          }
        }

        updateInfo();
      };
      const updateGrid1 = () => updateGrid(grid1, grid1GuiConfig);

      const gui = new dat.GUI();
      gui.width = 300;
      const grid1Gui = gui.addFolder("Grid 1");
      grid1Gui.add(grid1GuiConfig, "enabled").onChange(updateGrid1);
      grid1Gui
        .add(grid1.config, "gridWidth", 0.1, 1000, 0.1)
        .onChange(updateGrid1);
      grid1Gui
        .add(grid1.config, "gridHeight", 0.1, 1000, 0.1)
        .onChange(updateGrid1);
      grid1Gui
        .add(grid1.config, "units", [
          "degrees",
          "radians",
          "miles",
          "kilometers",
        ])
        .onChange(updateGrid1);

      grid1Gui.add(grid1.config, "minZoom", 0, 22, 0.1).onChange(updateGrid1);
      grid1Gui.add(grid1.config, "maxZoom", 0, 22, 0.1).onChange(updateGrid1);
      grid1Gui.open();
    });
  }, []);
  return (
    <>
      <div id="map" ref={mapContainer}></div>
      <div id="info"></div>
    </>
  );
}

export default Mapbox;
