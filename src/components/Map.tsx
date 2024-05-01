
"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext, LiveKitContext, MatrixContext } from "../app/page";
import { createRoot } from "react-dom/client";
import mapboxgl, { GeoJSONSource, MapMouseEvent } from 'mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
mapboxgl.accessToken = 'pk.eyJ1Ijoid2VpaHoiLCJhIjoiY2xlNjVuaWI1MDJjcjNybXJsbGo4bXgyMiJ9.w_9vD530_V81gcdS-yZOLw';
import 'mapbox-gl/dist/mapbox-gl.css';
import CreateRoom from "./CreateRoom";
import Call from "./Call";

export default function Map() {
  const { client, rooms, setRooms, spaceId } = useContext(MatrixContext);
  const { userId } = useContext(AuthContext);
  const { token, setToken, liveRoomId } = useContext(LiveKitContext);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [lng, setLng] = useState(-70.9);
  const [lat, setLat] = useState(42.35);
  const [zoom, setZoom] = useState(9);

  const roomPopup = useRef<mapboxgl.Popup | null>(null);

  const [joinRoomId, setJoinRoomId] = useState<string | null>(null);


  useEffect(() => {
    if (token) return;

    if (joinRoomId) {
      marker.current?.remove();
      roomPopup.current?.remove();
      const popupNode = document.createElement('div');
      const root = createRoot(popupNode);
      root.render(
        <Call 
          client={client!} 
          roomId={joinRoomId} 
          userId={userId!} 
          setToken={setToken}
          liveRoomId={liveRoomId!}
          joinRoomId={joinRoomId}
          setJoinRoomId={setJoinRoomId}
        />
      );
  
      roomPopup.current = new mapboxgl.Popup({
        closeButton: false,
        className: 'popup',
        closeOnClick: false,
      }).setDOMContent(popupNode)
        .setLngLat([rooms[joinRoomId].longitude, rooms[joinRoomId].latitude])
        .addTo(map.current!);
    }
  }, [joinRoomId, token]);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return; // ensure map container is loaded
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom
    });
    map.current.on('load', () => {
      setMapLoaded(true);
    });

    marker.current = new mapboxgl.Marker({
      color: 'red',
    })

    marker.current.getElement().addEventListener('click', (e) => {
      console.log('clicked marker');
      e.stopPropagation();
      marker.current?.remove();
    });

    map.current.on('click', (e: MapMouseEvent) => {
      e.preventDefault();
      marker.current?.remove();
      const features = map.current?.queryRenderedFeatures(e.point, {layers: ['clusters', 'unclustered-point']})
      if ((features || []).length) {
        console.log('clicked feature', features);
        return;
      }

      if (liveRoomId?.current) {
        console.log('clicked map while in call', e);
        return;
      }
      console.log('clicked map', e);
      roomPopup.current?.remove();

      const latitude = parseFloat(e.lngLat.lat.toFixed(2));
      const longitude = parseFloat(e.lngLat.lng.toFixed(2));

      const popupNode = document.createElement('div');
      const root = createRoot(popupNode);
      root.render(
        <CreateRoom
          client={client!}
          userId={userId!}
          spaceId={spaceId}
          longitude={longitude}
          latitude={latitude}
          setJoinRoomId={setJoinRoomId}
          setRooms={setRooms}
        />
      );
  
      const popup = new mapboxgl.Popup({
        closeButton: false,
        className: 'popup',
        closeOnClick: false,
      }).setDOMContent(popupNode);
      
      marker.current?.setPopup(popup);

      marker.current?.setLngLat([longitude, latitude]);
      marker.current?.addTo(map.current!);
      marker.current?.togglePopup();
    })
  });


  useEffect(() => {
    if (!map.current) return;
    if (!mapLoaded) return;
    if (map.current.getSource('rooms')) {
      map.current.removeLayer('clusters');
      map.current.removeLayer('cluster-count');
      map.current.removeLayer('unclustered-point');
      map.current.removeLayer('labels');
      map.current.removeSource('rooms');
    }
    map.current?.addSource('rooms', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: Object.entries(rooms).map(([roomId, { longitude, latitude, name }]) => {
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            properties: {
              roomId, 
              name,
            }
          };
        })
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });
    map.current.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'rooms',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          10,
          '#f1f075',
          100,
          '#f28cb1'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          10,
          30,
          100,
          40
        ]
      }
    });
    map.current.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'rooms',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    });
    map.current.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'rooms',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'case',
          ['==', ['get', 'roomId'], liveRoomId?.current],
          'blue',  // Color when matched 
          'red'    // Default 
        ],
        'circle-radius': 12,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
      }
    });
    map.current.addLayer({
      id: 'labels',
      type: 'symbol',
      source: 'rooms',
      layout: {
        'text-field': ['get', 'name'],
        'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
        'text-radial-offset': 0.8,
        'text-justify': 'auto',
        'text-size': 14
      },
      paint: {
        'text-color': '#000'
      }
    });
    map.current.on('click', 'clusters', (e) => {
      console.log('clicked cluster', e);
      const features = map.current?.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      if (!features) return;
      const clusterId = features[0].properties?.cluster_id;
      (map.current?.getSource('rooms') as GeoJSONSource).getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.current?.easeTo({
          center: (features[0].geometry as any).coordinates,
          zoom: zoom
        });
      });
    });
    map.current.on('click', 'unclustered-point', (e) => {
      roomPopup.current?.remove();
      console.log('clicked unclustered-point', e);
      const features = map.current?.queryRenderedFeatures(e.point, {
        layers: ['unclustered-point']
      });
      if (!features) return;

      const popupNode = document.createElement('div');
      const root = createRoot(popupNode);
      root.render(
        <Call 
          client={client!} 
          roomId={features[0].properties?.roomId} 
          userId={userId!} 
          setToken={setToken}
          liveRoomId={liveRoomId!}
          joinRoomId={joinRoomId}
          setJoinRoomId={setJoinRoomId}
        />
      );
  
      roomPopup.current = new mapboxgl.Popup({
        closeButton: false,
        className: 'popup',
        closeOnClick: false,
      }).setDOMContent(popupNode)
        .setLngLat((features[0].geometry as any).coordinates)
        .addTo(map.current!);
    });
  }, [rooms, mapLoaded, liveRoomId]);

  return (
    <div ref={mapContainer} style={{
      flex: 1,
      height: '100%',
    }} />
  );
}
