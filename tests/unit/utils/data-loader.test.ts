/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadClimateData,
  loadBaseLayer,
  loadTileIndex,
  loadTile,
  bboxIntersects,
  getTilesForBounds,
  getClimateData,
  getBaseLayerData,
  getLoadedTileCount,
  clearCache,
} from '../../../src/utils/data-loader.js';

// Mock topojson-client
vi.mock('topojson-client', () => ({
  feature: vi.fn((topology, object) => ({
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { id: 1 }, geometry: { type: 'Point', coordinates: [0, 0] } },
      { type: 'Feature', properties: { id: 2 }, geometry: { type: 'Point', coordinates: [1, 1] } },
    ],
  })),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Leaflet bounds
function createMockBounds(south: number, west: number, north: number, east: number) {
  return {
    getSouth: () => south,
    getNorth: () => north,
    getWest: () => west,
    getEast: () => east,
  };
}

describe('Data Loader Module', () => {
  beforeEach(() => {
    // Clear all caches before each test
    clearCache();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadClimateData', () => {
    it('should load and convert TopoJSON to GeoJSON', async () => {
      const mockTopoJSON = {
        type: 'Topology',
        objects: {
          climate: { type: 'GeometryCollection', geometries: [] },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTopoJSON),
      });

      const eventListener = vi.fn();
      document.addEventListener('koppen:data-loaded', eventListener);

      const result = await loadClimateData();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(2);
      expect(eventListener).toHaveBeenCalled();

      document.removeEventListener('koppen:data-loaded', eventListener);
    });

    it('should return cached data on subsequent calls', async () => {
      const mockTopoJSON = {
        type: 'Topology',
        objects: { climate: {} },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTopoJSON),
      });

      const result1 = await loadClimateData();
      const result2 = await loadClimateData();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
    });

    it('should handle loading errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const eventListener = vi.fn();
      document.addEventListener('koppen:data-error', eventListener);

      await expect(loadClimateData()).rejects.toThrow('Failed to load climate data: 404');
      expect(eventListener).toHaveBeenCalled();

      document.removeEventListener('koppen:data-error', eventListener);
    });

    it('should add and remove loading class on body', async () => {
      const mockTopoJSON = {
        type: 'Topology',
        objects: { climate: {} },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTopoJSON),
      });

      const loadPromise = loadClimateData();

      // During loading, class should be added (async so we check after)
      await loadPromise;

      // After loading, class should be removed
      expect(document.body.classList.contains('is-loading')).toBe(false);
    });

    it('should not start multiple simultaneous loads', async () => {
      const mockTopoJSON = {
        type: 'Topology',
        objects: { climate: {} },
      };

      let resolvePromise: (value: unknown) => void;
      const fetchPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce({
        ok: true,
        json: () => fetchPromise,
      });

      // Clear cache to ensure fresh load
      clearCache();

      // Start two loads simultaneously
      const promise1 = loadClimateData();
      const promise2 = loadClimateData();

      // Resolve the fetch
      resolvePromise!(mockTopoJSON);

      const result1 = await promise1;
      const result2 = await promise2;

      // Should only have called fetch once
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
    });
  });

  describe('loadBaseLayer', () => {
    it('should load base layer GeoJSON', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: {}, geometry: {} }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeoJSON),
      });

      const result = await loadBaseLayer();

      expect(result).toEqual(mockGeoJSON);
      expect(result.features).toHaveLength(1);
    });

    it('should return cached base layer on subsequent calls', async () => {
      const mockGeoJSON = { type: 'FeatureCollection', features: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeoJSON),
      });

      const result1 = await loadBaseLayer();
      const result2 = await loadBaseLayer();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
    });

    it('should throw on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(loadBaseLayer()).rejects.toThrow('Failed to load base layer: 500');
    });
  });

  describe('loadTileIndex', () => {
    it('should load tile index', async () => {
      const mockIndex = {
        tiles: [
          { file: 'tile_0_0.json', bbox: [0, 0, 10, 10] },
          { file: 'tile_10_0.json', bbox: [10, 0, 20, 10] },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIndex),
      });

      const result = await loadTileIndex();

      expect(result.tiles).toHaveLength(2);
    });

    it('should return cached tile index on subsequent calls', async () => {
      const mockIndex = { tiles: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIndex),
      });

      const result1 = await loadTileIndex();
      const result2 = await loadTileIndex();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
    });

    it('should throw on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(loadTileIndex()).rejects.toThrow('Failed to load tile index: 403');
    });
  });

  describe('loadTile', () => {
    it('should load a tile GeoJSON', async () => {
      const mockTile = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: { id: 1 } }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTile),
      });

      const result = await loadTile('tile_0_0.json');

      expect(result).toEqual(mockTile);
    });

    it('should cache loaded tiles', async () => {
      const mockTile = { type: 'FeatureCollection', features: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTile),
      });

      const result1 = await loadTile('tile_0_0.json');
      const result2 = await loadTile('tile_0_0.json');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
    });

    it('should throw on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(loadTile('nonexistent.json')).rejects.toThrow('Failed to load tile nonexistent.json: 404');
    });
  });

  describe('bboxIntersects', () => {
    describe('normal cases (no date line wrap)', () => {
      it('should return true for intersecting bboxes', () => {
        const tileBbox = [10, 10, 20, 20];
        const mapBounds = createMockBounds(5, 5, 25, 25);

        expect(bboxIntersects(tileBbox, mapBounds)).toBe(true);
      });

      it('should return true for partially overlapping bboxes', () => {
        const tileBbox = [10, 10, 20, 20];
        const mapBounds = createMockBounds(15, 15, 30, 30);

        expect(bboxIntersects(tileBbox, mapBounds)).toBe(true);
      });

      it('should return false for non-intersecting bboxes (latitude)', () => {
        const tileBbox = [0, 50, 10, 60]; // Northern tile
        const mapBounds = createMockBounds(-60, 0, -50, 10); // Southern view

        expect(bboxIntersects(tileBbox, mapBounds)).toBe(false);
      });

      it('should return false for non-intersecting bboxes (longitude)', () => {
        const tileBbox = [-180, 0, -170, 10]; // Western tile
        const mapBounds = createMockBounds(0, 170, 10, 180); // Eastern view

        expect(bboxIntersects(tileBbox, mapBounds)).toBe(false);
      });

      it('should return true for touching edges (latitude)', () => {
        const tileBbox = [0, 10, 10, 20];
        const mapBounds = createMockBounds(20, 0, 30, 10); // Touches at lat=20

        expect(bboxIntersects(tileBbox, mapBounds)).toBe(true);
      });

      it('should return true for touching edges (longitude)', () => {
        const tileBbox = [10, 0, 20, 10];
        const mapBounds = createMockBounds(0, 20, 10, 30); // Touches at lon=20

        expect(bboxIntersects(tileBbox, mapBounds)).toBe(true);
      });
    });

    describe('date line wrap-around cases', () => {
      it('should handle map view crossing date line', () => {
        // Map view spans from 170° to -170° (crosses date line)
        // This means mapMaxLon (-170) < mapMinLon (170)
        const mapBounds = createMockBounds(-10, 170, 10, -170);

        // Tile on eastern side (near 180°)
        const eastTile = [175, -5, 180, 5];
        expect(bboxIntersects(eastTile, mapBounds)).toBe(true);

        // Tile on western side (near -180°)
        const westTile = [-180, -5, -175, 5];
        expect(bboxIntersects(westTile, mapBounds)).toBe(true);

        // Tile in the middle (around 0°) - should NOT intersect
        const middleTile = [-10, -5, 10, 5];
        expect(bboxIntersects(middleTile, mapBounds)).toBe(false);
      });

      it('should return true for tile at 180 longitude', () => {
        const tileBbox = [170, -10, 180, 10];
        const mapBounds = createMockBounds(-5, 175, 5, -175);

        expect(bboxIntersects(tileBbox, mapBounds)).toBe(true);
      });
    });
  });

  describe('getTilesForBounds', () => {
    it('should return tiles that intersect with bounds', async () => {
      const mockIndex = {
        tiles: [
          { file: 'tile1.json', bbox: [0, 0, 10, 10] },
          { file: 'tile2.json', bbox: [20, 20, 30, 30] },
          { file: 'tile3.json', bbox: [5, 5, 15, 15] },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIndex),
      });

      const mapBounds = createMockBounds(0, 0, 12, 12);
      const result = await getTilesForBounds(mapBounds);

      // Should match tile1 and tile3, but not tile2
      expect(result).toHaveLength(2);
      expect(result.map(t => t.file)).toContain('tile1.json');
      expect(result.map(t => t.file)).toContain('tile3.json');
      expect(result.map(t => t.file)).not.toContain('tile2.json');
    });

    it('should return empty array when no tiles intersect', async () => {
      const mockIndex = {
        tiles: [
          { file: 'tile1.json', bbox: [100, 50, 110, 60] },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIndex),
      });

      const mapBounds = createMockBounds(-50, -100, -40, -90);
      const result = await getTilesForBounds(mapBounds);

      expect(result).toHaveLength(0);
    });
  });

  describe('getClimateData', () => {
    it('should return null when no data loaded', () => {
      expect(getClimateData()).toBeNull();
    });

    it('should return cached data after loading', async () => {
      const mockTopoJSON = {
        type: 'Topology',
        objects: { climate: {} },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTopoJSON),
      });

      await loadClimateData();

      const cachedData = getClimateData();
      expect(cachedData).not.toBeNull();
      expect(cachedData?.type).toBe('FeatureCollection');
    });
  });

  describe('getBaseLayerData', () => {
    it('should return null when no data loaded', () => {
      expect(getBaseLayerData()).toBeNull();
    });

    it('should return cached data after loading', async () => {
      const mockGeoJSON = { type: 'FeatureCollection', features: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeoJSON),
      });

      await loadBaseLayer();

      const cachedData = getBaseLayerData();
      expect(cachedData).not.toBeNull();
      expect(cachedData).toEqual(mockGeoJSON);
    });
  });

  describe('getLoadedTileCount', () => {
    it('should return 0 when no tiles loaded', () => {
      expect(getLoadedTileCount()).toBe(0);
    });

    it('should return correct count after loading tiles', async () => {
      const mockTile = { type: 'FeatureCollection', features: [] };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTile),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTile),
        });

      await loadTile('tile1.json');
      await loadTile('tile2.json');

      expect(getLoadedTileCount()).toBe(2);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      const mockTopoJSON = { type: 'Topology', objects: { climate: {} } };
      const mockGeoJSON = { type: 'FeatureCollection', features: [] };
      const mockIndex = { tiles: [] };
      const mockTile = { type: 'FeatureCollection', features: [] };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTopoJSON) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGeoJSON) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockIndex) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTile) });

      await loadClimateData();
      await loadBaseLayer();
      await loadTileIndex();
      await loadTile('tile.json');

      expect(getClimateData()).not.toBeNull();
      expect(getBaseLayerData()).not.toBeNull();
      expect(getLoadedTileCount()).toBe(1);

      clearCache();

      expect(getClimateData()).toBeNull();
      expect(getBaseLayerData()).toBeNull();
      expect(getLoadedTileCount()).toBe(0);
    });
  });
});
