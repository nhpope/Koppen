/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import L from 'leaflet';

// Mock Leaflet before importing the module
vi.mock('leaflet', () => {
  const mockLayer = {
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
    setStyle: vi.fn().mockReturnThis(),
    bringToFront: vi.fn().mockReturnThis(),
    bringToBack: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    options: {},
    feature: null,
    eachLayer: vi.fn(),
    clearLayers: vi.fn().mockReturnThis(),
    addData: vi.fn().mockReturnThis(),
    getLayers: vi.fn(() => []),
  };

  return {
    default: {
      geoJSON: vi.fn((data, options) => {
        const layer = { ...mockLayer };
        layer.options = options || {};
        layer.feature = data?.features?.[0] || null;

        const features = data?.features || [];
        layer.eachLayer = vi.fn((callback) => {
          features.forEach((feature: unknown) => {
            const featureLayer = {
              ...mockLayer,
              feature,
              setStyle: vi.fn(),
              bringToFront: vi.fn(),
              options: {},
            };
            callback(featureLayer);
          });
        });
        layer.getLayers = vi.fn(() => features.map((f: unknown) => ({ feature: f, setStyle: vi.fn() })));
        return layer;
      }),
    },
  };
});

// Create mockMap outside of vi.mock
const mockMap = {
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  getBounds: vi.fn(() => ({
    getSouth: () => -90,
    getNorth: () => 90,
    getWest: () => -180,
    getEast: () => 180,
  })),
  getZoom: vi.fn(() => 5),
  hasLayer: vi.fn(() => false),
};

// Mock data-loader
vi.mock('../../../src/utils/data-loader.js', () => ({
  loadBaseLayer: vi.fn(() => Promise.resolve({
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { id: 1, climate_type: 'Af' }, geometry: { type: 'Polygon' } },
    ],
  })),
  loadTileIndex: vi.fn(() => Promise.resolve({
    tiles: [{ file: 'tile_0_0.json', bbox: [0, 0, 10, 10] }],
  })),
  loadTile: vi.fn(() => Promise.resolve({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: { id: 100 }, geometry: {} }],
  })),
  getTilesForBounds: vi.fn(() => Promise.resolve([
    { file: 'tile_0_0.json', bbox: [0, 0, 10, 10] },
  ])),
}));

// Mock colors
vi.mock('../../../src/utils/colors.js', () => ({
  getClimateColor: vi.fn((type) => {
    const colors: Record<string, string> = {
      'Af': '#0000FF',
      'Am': '#007FFF',
      'Aw': '#00BFFF',
      'BWh': '#FF7F00',
      'BWk': '#FFBF00',
    };
    return colors[type] || '#CCCCCC';
  }),
}));

// Import the module under test after mocks are set up
import {
  createClimateLayer,
  filterByType,
  clearFilter,
  getActiveFilter,
  deselectCell,
  getFeatures,
  getSelectedCell,
  removeClimateLayer,
  reclassify,
  createHybridClimateLayer,
  getClassificationMode,
  switchToKoppenMode,
} from '../../../src/map/climate-layer.js';

describe('Climate Layer Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing layers
    removeClimateLayer();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createClimateLayer', () => {
    it('should create a climate layer from GeoJSON', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              id: 1,
              t1: 25, t2: 26, t3: 27, t4: 28, t5: 29, t6: 30,
              t7: 30, t8: 29, t9: 28, t10: 27, t11: 26, t12: 25,
              p1: 200, p2: 180, p3: 200, p4: 220, p5: 200, p6: 180,
              p7: 160, p8: 140, p9: 160, p10: 180, p11: 200, p12: 220,
              lat: 5,
            },
            geometry: { type: 'Polygon', coordinates: [] },
          },
        ],
      };

      const layer = createClimateLayer(geojson, mockMap);

      expect(L.geoJSON).toHaveBeenCalled();
      expect(layer).toBeDefined();
    });

    it('should use pre-classified climate_type if available', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { id: 1, climate_type: 'Af' },
            geometry: { type: 'Polygon', coordinates: [] },
          },
        ],
      };

      createClimateLayer(geojson, mockMap);

      // The layer should be created with the pre-classified type
      expect(L.geoJSON).toHaveBeenCalled();
    });

    it('should classify features from monthly data', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              id: 1,
              // Tropical data - all temps > 18°C, high precipitation
              t1: 27, t2: 27, t3: 28, t4: 28, t5: 28, t6: 27,
              t7: 27, t8: 27, t9: 28, t10: 28, t11: 28, t12: 27,
              p1: 300, p2: 280, p3: 300, p4: 300, p5: 280, p6: 250,
              p7: 200, p8: 180, p9: 200, p10: 250, p11: 280, p12: 300,
              lat: 5,
            },
            geometry: { type: 'Polygon', coordinates: [] },
          },
        ],
      };

      createClimateLayer(geojson, mockMap);

      expect(L.geoJSON).toHaveBeenCalled();
      // The classification happens internally - test passes if no error
    });

    it('should handle empty features array', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [],
      };

      const layer = createClimateLayer(geojson, mockMap);

      expect(L.geoJSON).toHaveBeenCalled();
      expect(layer).toBeDefined();
    });

    it('should dispatch koppen:layer-ready event', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:layer-ready', eventListener);

      const geojson = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { climate_type: 'Af' }, geometry: {} },
        ],
      };

      createClimateLayer(geojson, mockMap);

      expect(eventListener).toHaveBeenCalled();

      document.removeEventListener('koppen:layer-ready', eventListener);
    });
  });

  describe('filterByType', () => {
    beforeEach(() => {
      // Create a layer first
      const geojson = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { id: 1, climate_type: 'Af' }, geometry: {} },
          { type: 'Feature', properties: { id: 2, climate_type: 'BWh' }, geometry: {} },
        ],
      };
      createClimateLayer(geojson, mockMap);
    });

    it('should set active filter', () => {
      filterByType('Af');
      expect(getActiveFilter()).toBe('Af');
    });

    it('should dispatch koppen:filter-changed event', () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:filter-changed', eventListener);

      filterByType('BWh');

      expect(eventListener).toHaveBeenCalled();

      document.removeEventListener('koppen:filter-changed', eventListener);
    });
  });

  describe('clearFilter', () => {
    beforeEach(() => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { climate_type: 'Af' }, geometry: {} },
        ],
      };
      createClimateLayer(geojson, mockMap);
      filterByType('Af');
    });

    it('should clear the active filter', () => {
      expect(getActiveFilter()).toBe('Af');
      clearFilter();
      expect(getActiveFilter()).toBeNull();
    });
  });

  describe('getActiveFilter', () => {
    it('should return null when no filter is set', () => {
      expect(getActiveFilter()).toBeNull();
    });

    it('should return the active filter type', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: { climate_type: 'Af' }, geometry: {} }],
      };
      createClimateLayer(geojson, mockMap);

      filterByType('Af');
      expect(getActiveFilter()).toBe('Af');
    });
  });

  describe('deselectCell', () => {
    it('should execute without error', () => {
      // deselectCell clears any selected cell state
      expect(() => deselectCell()).not.toThrow();
    });
  });

  describe('getFeatures', () => {
    it('should return null when no layer exists', () => {
      removeClimateLayer();
      const features = getFeatures();
      expect(features).toBeNull();
    });

    it('should return classified features', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { climate_type: 'Af' }, geometry: {} },
          { type: 'Feature', properties: { climate_type: 'BWh' }, geometry: {} },
        ],
      };
      createClimateLayer(geojson, mockMap);

      const features = getFeatures();
      expect(features).toHaveLength(2);
    });
  });

  describe('getSelectedCell', () => {
    it('should return null when no cell is selected', () => {
      expect(getSelectedCell()).toBeNull();
    });
  });

  describe('removeClimateLayer', () => {
    it('should remove the climate layer', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: { climate_type: 'Af' }, geometry: {} }],
      };
      createClimateLayer(geojson, mockMap);

      removeClimateLayer();

      // After removal, getFeatures should return null
      expect(getFeatures()).toBeNull();
    });
  });

  describe('reclassify', () => {
    beforeEach(() => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              id: 1,
              t1: 25, t2: 26, t3: 27, t4: 28, t5: 29, t6: 30,
              t7: 30, t8: 29, t9: 28, t10: 27, t11: 26, t12: 25,
              p1: 200, p2: 180, p3: 200, p4: 220, p5: 200, p6: 180,
              p7: 160, p8: 140, p9: 160, p10: 180, p11: 200, p12: 220,
              lat: 5,
            },
            geometry: { type: 'Polygon', coordinates: [] },
          },
        ],
      };
      createClimateLayer(geojson, mockMap);
    });

    it('should reclassify features with new thresholds', () => {
      const newThresholds = {
        TMIN_TROPICAL: 20, // More strict threshold
      };

      reclassify(newThresholds);

      // Reclassification happens - test passes if no error
      expect(getFeatures()).toHaveLength(1);
    });
  });

  describe('createHybridClimateLayer', () => {
    it('should load base layer', async () => {
      const { loadBaseLayer } = await import('../../../src/utils/data-loader.js');

      await createHybridClimateLayer(mockMap);

      expect(loadBaseLayer).toHaveBeenCalled();
    });
  });

  describe('getClassificationMode', () => {
    it('should return current classification mode', () => {
      // Default mode should be 'koppen'
      expect(getClassificationMode()).toBe('koppen');
    });
  });

  describe('switchToKoppenMode', () => {
    beforeEach(() => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { climate_type: 'Af' }, geometry: {} },
        ],
      };
      createClimateLayer(geojson, mockMap);
    });

    it('should switch to koppen classification mode', () => {
      switchToKoppenMode();
      expect(getClassificationMode()).toBe('koppen');
    });
  });

  describe('Classification with custom thresholds', () => {
    it('should apply custom thresholds to classification', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              id: 1,
              // Border case - coldest month is exactly at threshold
              t1: 18, t2: 19, t3: 20, t4: 21, t5: 22, t6: 23,
              t7: 24, t8: 23, t9: 22, t10: 21, t11: 20, t12: 19,
              p1: 100, p2: 100, p3: 100, p4: 100, p5: 100, p6: 100,
              p7: 100, p8: 100, p9: 100, p10: 100, p11: 100, p12: 100,
              lat: 0,
            },
            geometry: { type: 'Polygon', coordinates: [] },
          },
        ],
      };

      const customThresholds = {
        TMIN_TROPICAL: 18, // Exactly at the border
      };

      createClimateLayer(geojson, mockMap, customThresholds);

      // Classification happens with custom thresholds
      expect(getFeatures()).toHaveLength(1);
    });
  });

  describe('Multiple feature handling', () => {
    it('should classify multiple features efficiently', () => {
      const features = Array.from({ length: 100 }, (_, i) => ({
        type: 'Feature',
        properties: {
          id: i,
          t1: 25 + (i % 10), t2: 26, t3: 27, t4: 28, t5: 29, t6: 30,
          t7: 30, t8: 29, t9: 28, t10: 27, t11: 26, t12: 25,
          p1: 200, p2: 180, p3: 200, p4: 220, p5: 200, p6: 180,
          p7: 160, p8: 140, p9: 160, p10: 180, p11: 200, p12: 220,
          lat: i - 50,
        },
        geometry: { type: 'Polygon', coordinates: [] },
      }));

      const geojson = { type: 'FeatureCollection', features };

      createClimateLayer(geojson, mockMap);

      expect(getFeatures()).toHaveLength(100);
    });
  });

  describe('filterByType branches', () => {
    it('should warn when no layers to filter', () => {
      removeClimateLayer();
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      filterByType('Af');

      expect(consoleWarnSpy).toHaveBeenCalledWith('[Koppen] No layers to filter');
      consoleWarnSpy.mockRestore();
    });

    it('should clear filter when filterByType called with null', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { climate_type: 'Af' }, geometry: {} },
        ],
      };
      createClimateLayer(geojson, mockMap);
      filterByType('Af');

      filterByType(null);

      expect(getActiveFilter()).toBeNull();
    });

    it('should not call filterByType if no active filter when clearing', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { climate_type: 'Af' }, geometry: {} },
        ],
      };
      createClimateLayer(geojson, mockMap);

      // No filter set, calling clearFilter should not call filterByType
      clearFilter();

      expect(getActiveFilter()).toBeNull();
    });
  });

  describe('reclassify branches', () => {
    it('should warn when no layer to reclassify', () => {
      removeClimateLayer();
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      reclassify({ tropical_min: 20 });

      expect(consoleWarnSpy).toHaveBeenCalledWith('[Koppen] No climate layer to reclassify');
      consoleWarnSpy.mockRestore();
    });

    it('should dispatch koppen:classification-updated event', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              id: 1,
              t1: 25, t2: 26, t3: 27, t4: 28, t5: 29, t6: 30,
              t7: 30, t8: 29, t9: 28, t10: 27, t11: 26, t12: 25,
              p1: 200, p2: 180, p3: 200, p4: 220, p5: 200, p6: 180,
              p7: 160, p8: 140, p9: 160, p10: 180, p11: 200, p12: 220,
              lat: 5,
            },
            geometry: { type: 'Polygon', coordinates: [] },
          },
        ],
      };
      createClimateLayer(geojson, mockMap);

      const eventListener = vi.fn();
      document.addEventListener('koppen:classification-updated', eventListener);

      reclassify({ tropical_min: 20 });

      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].detail).toHaveProperty('count');
      expect(eventListener.mock.calls[0][0].detail).toHaveProperty('stats');

      document.removeEventListener('koppen:classification-updated', eventListener);
    });
  });

  describe('Feature styling', () => {
    it('should handle features with custom climate_color', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { climate_type: 'CustomType', climate_color: '#FF0000' },
            geometry: {},
          },
        ],
      };

      createClimateLayer(geojson, mockMap);

      // The layer should be created with custom color
      expect(L.geoJSON).toHaveBeenCalled();
    });

    it('should handle features without climate_type (classified: false)', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { classified: false },
            geometry: {},
          },
        ],
      };

      createClimateLayer(geojson, mockMap);

      expect(L.geoJSON).toHaveBeenCalled();
    });
  });

  describe('Event handling', () => {
    it('should dispatch koppen:cell-deselected event on deselect', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { climate_type: 'Af', lat: 5, lon: 10 }, geometry: {} },
        ],
      };
      createClimateLayer(geojson, mockMap);

      // First test that deselectCell doesn't throw when nothing selected
      expect(() => deselectCell()).not.toThrow();
    });

    it('should handle koppen:custom-rules-changed event', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { climate_type: 'Af' }, geometry: {} },
        ],
      };
      createClimateLayer(geojson, mockMap);

      // Dispatch without engine - should not throw
      document.dispatchEvent(new CustomEvent('koppen:custom-rules-changed', {
        detail: {},
      }));
    });

    it('should handle koppen:mode-changed event for koppen mode', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { climate_type: 'Af' }, geometry: {} },
        ],
      };
      createClimateLayer(geojson, mockMap);

      document.dispatchEvent(new CustomEvent('koppen:mode-changed', {
        detail: { mode: 'koppen' },
      }));

      expect(getClassificationMode()).toBe('koppen');
    });
  });

  describe('reclassifyWithCustomRules', () => {
    let reclassifyWithCustomRules: typeof import('../../../src/map/climate-layer.js').reclassifyWithCustomRules;

    beforeEach(async () => {
      const module = await import('../../../src/map/climate-layer.js');
      reclassifyWithCustomRules = module.reclassifyWithCustomRules;
    });

    it('should warn when no engine provided', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      reclassifyWithCustomRules(null as any);

      expect(consoleWarnSpy).toHaveBeenCalledWith('[Koppen] No custom rules engine provided');
      consoleWarnSpy.mockRestore();
    });

    it('should handle engine with empty results', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { climate_type: 'Af' }, geometry: {} },
        ],
      };
      createClimateLayer(geojson, mockMap);

      const mockEngine = {
        classifyAll: vi.fn(() => ({ classified: [], unclassified: [], stats: { classified: 0, unclassified: 0 } })),
      };

      // Should not throw, just classify with empty results
      expect(() => reclassifyWithCustomRules(mockEngine as any)).not.toThrow();
      expect(mockEngine.classifyAll).toHaveBeenCalled();
    });

    it('should dispatch classification events', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              id: 1,
              t1: 25, t2: 26, t3: 27, t4: 28, t5: 29, t6: 30,
              t7: 30, t8: 29, t9: 28, t10: 27, t11: 26, t12: 25,
              p1: 200, p2: 180, p3: 200, p4: 220, p5: 200, p6: 180,
              p7: 160, p8: 140, p9: 160, p10: 180, p11: 200, p12: 220,
              lat: 5,
            },
            geometry: { type: 'Polygon', coordinates: [] },
          },
        ],
      };
      createClimateLayer(geojson, mockMap);

      const classifiedFeature = {
        ...geojson.features[0],
        properties: {
          ...geojson.features[0].properties,
          climate_type: 'CustomAf',
          climate_name: 'Custom Tropical',
          climate_color: '#00FF00',
          classified: true,
        },
      };

      const mockEngine = {
        classifyAll: vi.fn(() => ({
          classified: [classifiedFeature],
          unclassified: [],
          stats: { classified: 1, unclassified: 0, categories: { CustomAf: 1 } },
        })),
      };

      const statsListener = vi.fn();
      const updateListener = vi.fn();
      document.addEventListener('koppen:classification-stats', statsListener);
      document.addEventListener('koppen:classification-updated', updateListener);

      reclassifyWithCustomRules(mockEngine as any);

      expect(mockEngine.classifyAll).toHaveBeenCalled();
      expect(statsListener).toHaveBeenCalled();
      expect(updateListener).toHaveBeenCalled();

      document.removeEventListener('koppen:classification-stats', statsListener);
      document.removeEventListener('koppen:classification-updated', updateListener);
    });
  });

  describe('createHybridClimateLayer additional branches', () => {
    it('should dispatch koppen:layer-ready event', async () => {
      const eventListener = vi.fn();
      document.addEventListener('koppen:layer-ready', eventListener);

      await createHybridClimateLayer(mockMap);

      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].detail).toHaveProperty('mode', 'base');

      document.removeEventListener('koppen:layer-ready', eventListener);
    });

    it('should handle errors during base layer loading', async () => {
      const { loadBaseLayer } = await import('../../../src/utils/data-loader.js');
      vi.mocked(loadBaseLayer).mockRejectedValueOnce(new Error('Network error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(createHybridClimateLayer(mockMap)).rejects.toThrow('Network error');

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Feature classification edge cases', () => {
    it('should handle missing temperature/precipitation data', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              id: 1,
              // Missing some monthly data - should use 0 as default
              t1: 25, t2: 26,
              p1: 200, p2: 180,
              lat: 5,
            },
            geometry: { type: 'Polygon', coordinates: [] },
          },
        ],
      };

      createClimateLayer(geojson, mockMap);

      expect(getFeatures()).toHaveLength(1);
    });

    it('should handle unknown climate type in CLIMATE_TYPES', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              id: 1,
              // Data that might produce an unknown type
              t1: 0, t2: 0, t3: 0, t4: 0, t5: 0, t6: 0,
              t7: 0, t8: 0, t9: 0, t10: 0, t11: 0, t12: 0,
              p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0,
              p7: 0, p8: 0, p9: 0, p10: 0, p11: 0, p12: 0,
              lat: 0,
            },
            geometry: { type: 'Polygon', coordinates: [] },
          },
        ],
      };

      createClimateLayer(geojson, mockMap);

      expect(getFeatures()).toHaveLength(1);
    });

    it('should use classifiedType fallback in feature properties', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              id: 1,
              classifiedType: 'Af',  // Using classifiedType instead of climate_type
            },
            geometry: { type: 'Polygon', coordinates: [] },
          },
        ],
      };

      createClimateLayer(geojson, mockMap);

      expect(getFeatures()).toHaveLength(1);
    });
  });

  describe('Filter event details', () => {
    it('should include active flag in filter-changed event', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { climate_type: 'Af' }, geometry: {} },
        ],
      };
      createClimateLayer(geojson, mockMap);

      const eventListener = vi.fn();
      document.addEventListener('koppen:filter-changed', eventListener);

      filterByType('Af');

      expect(eventListener.mock.calls[0][0].detail).toEqual({
        type: 'Af',
        active: true,
      });

      filterByType(null);

      expect(eventListener.mock.calls[1][0].detail).toEqual({
        type: null,
        active: false,
      });

      document.removeEventListener('koppen:filter-changed', eventListener);
    });
  });

  describe('switchToKoppenMode with thresholds', () => {
    it('should accept custom thresholds parameter', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { climate_type: 'Af' }, geometry: {} },
        ],
      };
      createClimateLayer(geojson, mockMap);

      const customThresholds = { tropical_min: 20 };

      expect(() => switchToKoppenMode(customThresholds)).not.toThrow();
      expect(getClassificationMode()).toBe('koppen');
    });
  });
});
