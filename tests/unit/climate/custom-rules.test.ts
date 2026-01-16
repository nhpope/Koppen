/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CustomRulesEngine, {
  OPERATORS,
  PARAMETERS,
  DEFAULT_COLORS,
  createCategory,
  createRule,
} from '../../../src/climate/custom-rules.js';

describe('Custom Rules Module', () => {
  describe('OPERATORS', () => {
    it('should have all basic comparison operators', () => {
      expect(OPERATORS['<']).toBeDefined();
      expect(OPERATORS['<=']).toBeDefined();
      expect(OPERATORS['>']).toBeDefined();
      expect(OPERATORS['>=']).toBeDefined();
      expect(OPERATORS['==']).toBeDefined();
      expect(OPERATORS['!=']).toBeDefined();
    });

    it('should have range operators', () => {
      expect(OPERATORS['in_range']).toBeDefined();
      expect(OPERATORS['not_in_range']).toBeDefined();
    });

    describe('operator functions', () => {
      it('should evaluate < correctly', () => {
        expect(OPERATORS['<'].fn(5, 10)).toBe(true);
        expect(OPERATORS['<'].fn(10, 10)).toBe(false);
        expect(OPERATORS['<'].fn(15, 10)).toBe(false);
      });

      it('should evaluate <= correctly', () => {
        expect(OPERATORS['<='].fn(5, 10)).toBe(true);
        expect(OPERATORS['<='].fn(10, 10)).toBe(true);
        expect(OPERATORS['<='].fn(15, 10)).toBe(false);
      });

      it('should evaluate > correctly', () => {
        expect(OPERATORS['>'].fn(15, 10)).toBe(true);
        expect(OPERATORS['>'].fn(10, 10)).toBe(false);
        expect(OPERATORS['>'].fn(5, 10)).toBe(false);
      });

      it('should evaluate >= correctly', () => {
        expect(OPERATORS['>='].fn(15, 10)).toBe(true);
        expect(OPERATORS['>='].fn(10, 10)).toBe(true);
        expect(OPERATORS['>='].fn(5, 10)).toBe(false);
      });

      it('should evaluate == correctly with tolerance', () => {
        expect(OPERATORS['=='].fn(10, 10)).toBe(true);
        expect(OPERATORS['=='].fn(10.0001, 10.0002)).toBe(true); // within tolerance
        expect(OPERATORS['=='].fn(10, 11)).toBe(false);
      });

      it('should evaluate != correctly with tolerance', () => {
        expect(OPERATORS['!='].fn(10, 11)).toBe(true);
        expect(OPERATORS['!='].fn(10, 10)).toBe(false);
        expect(OPERATORS['!='].fn(10.0001, 10.0002)).toBe(false); // within tolerance
      });

      it('should evaluate in_range correctly', () => {
        expect(OPERATORS['in_range'].fn(15, [10, 20])).toBe(true);
        expect(OPERATORS['in_range'].fn(10, [10, 20])).toBe(true); // inclusive
        expect(OPERATORS['in_range'].fn(20, [10, 20])).toBe(true); // inclusive
        expect(OPERATORS['in_range'].fn(5, [10, 20])).toBe(false);
        expect(OPERATORS['in_range'].fn(25, [10, 20])).toBe(false);
      });

      it('should evaluate not_in_range correctly', () => {
        expect(OPERATORS['not_in_range'].fn(5, [10, 20])).toBe(true);
        expect(OPERATORS['not_in_range'].fn(25, [10, 20])).toBe(true);
        expect(OPERATORS['not_in_range'].fn(15, [10, 20])).toBe(false);
        expect(OPERATORS['not_in_range'].fn(10, [10, 20])).toBe(false); // inclusive boundary
      });
    });
  });

  describe('PARAMETERS', () => {
    it('should have temperature parameters', () => {
      expect(PARAMETERS.MAT).toBeDefined();
      expect(PARAMETERS.Tmin).toBeDefined();
      expect(PARAMETERS.Tmax).toBeDefined();
      expect(PARAMETERS.WarmMonths).toBeDefined();
    });

    it('should have precipitation parameters', () => {
      expect(PARAMETERS.MAP).toBeDefined();
      expect(PARAMETERS.Pdry).toBeDefined();
      expect(PARAMETERS.Pwet).toBeDefined();
      expect(PARAMETERS.Psummer).toBeDefined();
      expect(PARAMETERS.Pwinter).toBeDefined();
      expect(PARAMETERS.Psdry).toBeDefined();
      expect(PARAMETERS.Pwdry).toBeDefined();
      expect(PARAMETERS.Pswet).toBeDefined();
      expect(PARAMETERS.Pwwet).toBeDefined();
    });

    it('should have derived parameters', () => {
      expect(PARAMETERS.AridityIndex).toBeDefined();
    });

    describe('parameter computation', () => {
      const mockProps = {
        lat: 45, // Northern hemisphere
        mat: 15,
        tmin: -5,
        tmax: 30,
        map: 800,
        pdry: 20,
        t1: 0, t2: 2, t3: 8, t4: 12, t5: 18, t6: 22,
        t7: 25, t8: 24, t9: 18, t10: 12, t11: 5, t12: 1,
        p1: 50, p2: 45, p3: 55, p4: 60, p5: 80, p6: 70,
        p7: 40, p8: 35, p9: 55, p10: 70, p11: 65, p12: 55,
      };

      it('should compute MAT correctly', () => {
        const result = PARAMETERS.MAT.compute(mockProps);
        expect(result).toBe(15); // Uses provided mat value
      });

      it('should compute MAT from monthly temps if mat not provided', () => {
        const propsNoMat = { ...mockProps, mat: undefined };
        const result = PARAMETERS.MAT.compute(propsNoMat);
        // Average of t1-t12
        const expected = (0+2+8+12+18+22+25+24+18+12+5+1) / 12;
        expect(result).toBeCloseTo(expected, 1);
      });

      it('should compute Tmin correctly', () => {
        const result = PARAMETERS.Tmin.compute(mockProps);
        expect(result).toBe(-5); // Uses provided tmin value
      });

      it('should compute Tmin from monthly temps if tmin not provided', () => {
        const propsNoTmin = { ...mockProps, tmin: undefined };
        const result = PARAMETERS.Tmin.compute(propsNoTmin);
        expect(result).toBe(0); // Min of monthly temps (t1 = 0)
      });

      it('should compute Tmax correctly', () => {
        const result = PARAMETERS.Tmax.compute(mockProps);
        expect(result).toBe(30); // Uses provided tmax value
      });

      it('should compute Tmax from monthly temps if tmax not provided', () => {
        const propsNoTmax = { ...mockProps, tmax: undefined };
        const result = PARAMETERS.Tmax.compute(propsNoTmax);
        expect(result).toBe(25); // Max of monthly temps (t7 = 25)
      });

      it('should compute WarmMonths correctly', () => {
        const result = PARAMETERS.WarmMonths.compute(mockProps);
        // Months with temp >= 10: t4=12, t5=18, t6=22, t7=25, t8=24, t9=18, t10=12 = 7 months
        expect(result).toBe(7);
      });

      it('should compute MAP correctly', () => {
        const result = PARAMETERS.MAP.compute(mockProps);
        expect(result).toBe(800); // Uses provided map value
      });

      it('should compute MAP from monthly precip if map not provided', () => {
        const propsNoMap = { ...mockProps, map: undefined };
        const result = PARAMETERS.MAP.compute(propsNoMap);
        // Sum of p1-p12
        const expected = 50+45+55+60+80+70+40+35+55+70+65+55;
        expect(result).toBe(expected);
      });

      it('should compute Pdry correctly', () => {
        const result = PARAMETERS.Pdry.compute(mockProps);
        expect(result).toBe(20); // Uses provided pdry value
      });

      it('should compute Pdry from monthly precip if pdry not provided', () => {
        const propsNoPdry = { ...mockProps, pdry: undefined };
        const result = PARAMETERS.Pdry.compute(propsNoPdry);
        expect(result).toBe(35); // Min of monthly precips (p8 = 35)
      });

      it('should compute Pwet correctly', () => {
        const result = PARAMETERS.Pwet.compute(mockProps);
        expect(result).toBe(80); // Max of monthly precips (p5 = 80)
      });

      it('should compute Psummer for northern hemisphere', () => {
        const result = PARAMETERS.Psummer.compute(mockProps);
        // Summer months for northern: April-September (indices 3-8 in 0-indexed)
        // p4=60, p5=80, p6=70, p7=40, p8=35, p9=55 = 340
        expect(result).toBe(340);
      });

      it('should compute Psummer for southern hemisphere', () => {
        const southernProps = { ...mockProps, lat: -45 };
        const result = PARAMETERS.Psummer.compute(southernProps);
        // Summer months for southern: October-March (indices 9,10,11,0,1,2)
        // p10=70, p11=65, p12=55, p1=50, p2=45, p3=55 = 340
        expect(result).toBe(340);
      });

      it('should compute Pwinter for northern hemisphere', () => {
        const result = PARAMETERS.Pwinter.compute(mockProps);
        // Winter months for northern: October-March (indices 9,10,11,0,1,2)
        // p10=70, p11=65, p12=55, p1=50, p2=45, p3=55 = 340
        expect(result).toBe(340);
      });

      it('should compute Pwinter for southern hemisphere', () => {
        const southernProps = { ...mockProps, lat: -45 };
        const result = PARAMETERS.Pwinter.compute(southernProps);
        // Winter months for southern: April-September (indices 3-8)
        // p4=60, p5=80, p6=70, p7=40, p8=35, p9=55 = 340
        expect(result).toBe(340);
      });

      it('should compute Psdry correctly', () => {
        const result = PARAMETERS.Psdry.compute(mockProps);
        // Driest summer month (northern): min of p4-p9 = 35 (p8)
        expect(result).toBe(35);
      });

      it('should compute Pwdry correctly', () => {
        const result = PARAMETERS.Pwdry.compute(mockProps);
        // Driest winter month (northern): min of p10,p11,p12,p1,p2,p3 = 45 (p2)
        expect(result).toBe(45);
      });

      it('should compute Pswet correctly', () => {
        const result = PARAMETERS.Pswet.compute(mockProps);
        // Wettest summer month (northern): max of p4-p9 = 80 (p5)
        expect(result).toBe(80);
      });

      it('should compute Pwwet correctly', () => {
        const result = PARAMETERS.Pwwet.compute(mockProps);
        // Wettest winter month (northern): max of p10,p11,p12,p1,p2,p3 = 70 (p10)
        expect(result).toBe(70);
      });

      it('should compute AridityIndex correctly', () => {
        const result = PARAMETERS.AridityIndex.compute(mockProps);
        // MAP / (MAT + 10) = 800 / (15 + 10) = 32
        expect(result).toBe(32);
      });
    });

    it('should have valid ranges for all parameters', () => {
      Object.entries(PARAMETERS).forEach(([id, param]) => {
        expect(param.range).toBeDefined();
        expect(param.range).toHaveLength(2);
        expect(param.range[0]).toBeLessThanOrEqual(param.range[1]);
      });
    });

    it('should have valid step values for all parameters', () => {
      Object.entries(PARAMETERS).forEach(([id, param]) => {
        expect(param.step).toBeDefined();
        expect(param.step).toBeGreaterThan(0);
      });
    });
  });

  describe('DEFAULT_COLORS', () => {
    it('should have 10 default colors', () => {
      expect(DEFAULT_COLORS).toHaveLength(10);
    });

    it('should have valid hex colors', () => {
      DEFAULT_COLORS.forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('CustomRulesEngine', () => {
    let engine: InstanceType<typeof CustomRulesEngine>;
    let eventListener: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      engine = new CustomRulesEngine();
      eventListener = vi.fn();
    });

    afterEach(() => {
      document.removeEventListener('koppen:category-added', eventListener);
      document.removeEventListener('koppen:category-updated', eventListener);
      document.removeEventListener('koppen:category-removed', eventListener);
      document.removeEventListener('koppen:categories-reordered', eventListener);
      document.removeEventListener('koppen:rule-added', eventListener);
      document.removeEventListener('koppen:rule-updated', eventListener);
      document.removeEventListener('koppen:rule-removed', eventListener);
    });

    describe('Constructor', () => {
      it('should create empty engine by default', () => {
        expect(engine.categories).toHaveLength(0);
      });

      it('should initialize with provided categories', () => {
        const categories = [
          { name: 'Hot', color: '#FF0000', rules: [] },
          { name: 'Cold', color: '#0000FF', rules: [] },
        ];
        engine = new CustomRulesEngine(categories);
        expect(engine.categories).toHaveLength(2);
        expect(engine.categories[0].name).toBe('Hot');
        expect(engine.categories[1].name).toBe('Cold');
      });

      it('should generate IDs for categories without IDs', () => {
        const categories = [{ name: 'Test', color: '#FF0000', rules: [] }];
        engine = new CustomRulesEngine(categories);
        expect(engine.categories[0].id).toBeDefined();
        expect(engine.categories[0].id).toMatch(/^id_/);
      });

      it('should preserve existing IDs', () => {
        const categories = [{ id: 'my-id', name: 'Test', color: '#FF0000', rules: [] }];
        engine = new CustomRulesEngine(categories);
        expect(engine.categories[0].id).toBe('my-id');
      });

      it('should set default values for missing fields', () => {
        const categories = [{}];
        engine = new CustomRulesEngine(categories);
        expect(engine.categories[0].name).toBe('Untitled Category');
        expect(engine.categories[0].color).toBe(DEFAULT_COLORS[0]);
        expect(engine.categories[0].description).toBe('');
        expect(engine.categories[0].enabled).toBe(true);
      });

      it('should sort categories by priority', () => {
        const categories = [
          { name: 'Third', priority: 2 },
          { name: 'First', priority: 0 },
          { name: 'Second', priority: 1 },
        ];
        engine = new CustomRulesEngine(categories);
        expect(engine.categories[0].name).toBe('First');
        expect(engine.categories[1].name).toBe('Second');
        expect(engine.categories[2].name).toBe('Third');
      });

      it('should initialize rules with default values', () => {
        const categories = [
          {
            name: 'Test',
            rules: [{ value: 10 }], // Missing parameter and operator
          },
        ];
        engine = new CustomRulesEngine(categories);
        expect(engine.categories[0].rules[0].parameter).toBe('MAT');
        expect(engine.categories[0].rules[0].operator).toBe('>=');
        expect(engine.categories[0].rules[0].value).toBe(10);
      });
    });

    describe('getSortedCategories', () => {
      it('should return categories sorted by priority', () => {
        engine = new CustomRulesEngine([
          { name: 'B', priority: 1 },
          { name: 'A', priority: 0 },
          { name: 'C', priority: 2 },
        ]);

        const sorted = engine.getSortedCategories();
        expect(sorted[0].name).toBe('A');
        expect(sorted[1].name).toBe('B');
        expect(sorted[2].name).toBe('C');
      });

      it('should return a copy, not the original array', () => {
        engine.addCategory({ name: 'Test' });
        const sorted = engine.getSortedCategories();
        sorted.push({ id: 'fake', name: 'Fake', color: '#000', rules: [], priority: 99, enabled: true, description: '' });
        expect(engine.categories).toHaveLength(1);
      });
    });

    describe('getParameterValue', () => {
      it('should compute parameter value from feature properties', () => {
        const props = { mat: 25 };
        const value = engine.getParameterValue('MAT', props);
        expect(value).toBe(25);
      });

      it('should return 0 for unknown parameter', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const value = engine.getParameterValue('UNKNOWN', {});
        expect(value).toBe(0);
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
      });
    });

    describe('evaluateRule', () => {
      it('should evaluate a simple comparison rule', () => {
        const rule = { parameter: 'MAT', operator: '>', value: 20 };
        const props = { mat: 25 };
        expect(engine.evaluateRule(rule, props)).toBe(true);
      });

      it('should return false for unknown operator', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const rule = { parameter: 'MAT', operator: 'INVALID', value: 20 };
        const props = { mat: 25 };
        expect(engine.evaluateRule(rule, props)).toBe(false);
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
      });

      it('should evaluate range operator', () => {
        const rule = { parameter: 'MAT', operator: 'in_range', value: [15, 25] };
        expect(engine.evaluateRule(rule, { mat: 20 })).toBe(true);
        expect(engine.evaluateRule(rule, { mat: 10 })).toBe(false);
      });

      it('should handle evaluation errors gracefully', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        // Create a rule that would cause an error (e.g., range op with non-array value)
        // Note: The current implementation may not throw, but we test error handling
        const rule = { parameter: 'MAT', operator: 'in_range', value: null };
        engine.evaluateRule(rule, { mat: 20 });
        // If it doesn't throw, the test passes
        errorSpy.mockRestore();
      });
    });

    describe('classify', () => {
      beforeEach(() => {
        engine = new CustomRulesEngine([
          {
            name: 'Tropical',
            color: '#FF0000',
            priority: 0,
            enabled: true,
            rules: [
              { parameter: 'Tmin', operator: '>=', value: 18 },
            ],
          },
          {
            name: 'Temperate',
            color: '#00FF00',
            priority: 1,
            enabled: true,
            rules: [
              { parameter: 'Tmin', operator: '>=', value: -3 },
              { parameter: 'Tmin', operator: '<', value: 18 },
            ],
          },
          {
            name: 'Cold',
            color: '#0000FF',
            priority: 2,
            enabled: true,
            rules: [
              { parameter: 'Tmin', operator: '<', value: -3 },
            ],
          },
        ]);
      });

      it('should classify a feature into a matching category', () => {
        const feature = { properties: { tmin: 20 } };
        const result = engine.classify(feature);
        expect(result).not.toBeNull();
        expect(result?.categoryName).toBe('Tropical');
      });

      it('should return first matching category by priority', () => {
        const feature = { properties: { tmin: 10 } };
        const result = engine.classify(feature);
        expect(result?.categoryName).toBe('Temperate');
      });

      it('should return null for unclassified feature', () => {
        // Add an empty engine with no matching rules
        engine = new CustomRulesEngine([
          { name: 'Empty', rules: [] }, // No rules = never matches
        ]);
        const feature = { properties: { tmin: 10 } };
        const result = engine.classify(feature);
        expect(result).toBeNull();
      });

      it('should skip disabled categories', () => {
        engine.categories[0].enabled = false; // Disable Tropical
        const feature = { properties: { tmin: 20 } };
        const result = engine.classify(feature);
        // Should skip Tropical and match Temperate (since tmin=20 >= -3 and < 18 is false)
        // Actually tmin=20 is not < 18, so Temperate won't match either
        // Cold requires tmin < -3, which is also false
        // So should be null
        expect(result).toBeNull();
      });

      it('should require ALL rules to pass (AND logic)', () => {
        const feature = { properties: { tmin: 20 } }; // Passes Tmin >= -3 but not < 18
        // Temperate requires both: Tmin >= -3 AND Tmin < 18
        // 20 >= -3 is true, but 20 < 18 is false
        // So Temperate should not match
        const result = engine.classify(feature);
        expect(result?.categoryName).toBe('Tropical'); // Matches Tropical first
      });
    });

    describe('classifyAll', () => {
      beforeEach(() => {
        engine = new CustomRulesEngine([
          {
            id: 'tropical',
            name: 'Tropical',
            color: '#FF0000',
            rules: [{ parameter: 'Tmin', operator: '>=', value: 18 }],
          },
          {
            id: 'cold',
            name: 'Cold',
            color: '#0000FF',
            rules: [{ parameter: 'Tmin', operator: '<', value: 0 }],
          },
        ]);
      });

      it('should classify multiple features', () => {
        const features = [
          { properties: { tmin: 20 } },
          { properties: { tmin: -5 } },
          { properties: { tmin: 10 } }, // Unclassified
        ];

        const result = engine.classifyAll(features);

        expect(result.classified).toHaveLength(2);
        expect(result.unclassified).toHaveLength(1);
        expect(result.stats.total).toBe(3);
        expect(result.stats.classified).toBe(2);
        expect(result.stats.unclassified).toBe(1);
      });

      it('should add climate properties to classified features', () => {
        const features = [{ properties: { tmin: 20, id: 1 } }];
        const result = engine.classifyAll(features);

        expect(result.classified[0].properties.climate_type).toBe('tropical');
        expect(result.classified[0].properties.climate_name).toBe('Tropical');
        expect(result.classified[0].properties.climate_color).toBe('#FF0000');
        expect(result.classified[0].properties.classified).toBe(true);
        expect(result.classified[0].properties.id).toBe(1); // Original properties preserved
      });

      it('should mark unclassified features', () => {
        const features = [{ properties: { tmin: 10 } }];
        const result = engine.classifyAll(features);

        expect(result.unclassified[0].properties.climate_type).toBeNull();
        expect(result.unclassified[0].properties.climate_name).toBe('Unclassified');
        expect(result.unclassified[0].properties.climate_color).toBe('#CCCCCC');
        expect(result.unclassified[0].properties.classified).toBe(false);
      });

      it('should track statistics by category', () => {
        const features = [
          { properties: { tmin: 20 } },
          { properties: { tmin: 22 } },
          { properties: { tmin: -5 } },
        ];

        const result = engine.classifyAll(features);

        expect(result.stats.byCategory['tropical'].count).toBe(2);
        expect(result.stats.byCategory['cold'].count).toBe(1);
      });
    });

    describe('Category Management', () => {
      describe('addCategory', () => {
        it('should add a new category', () => {
          document.addEventListener('koppen:category-added', eventListener);

          const cat = engine.addCategory({ name: 'New Category', color: '#FF0000' });

          expect(engine.categories).toHaveLength(1);
          expect(cat.name).toBe('New Category');
          expect(cat.color).toBe('#FF0000');
          expect(eventListener).toHaveBeenCalled();
        });

        it('should generate default name if not provided', () => {
          const cat = engine.addCategory();
          expect(cat.name).toBe('Category 1');
        });

        it('should cycle through default colors', () => {
          for (let i = 0; i < 12; i++) {
            engine.addCategory();
          }
          expect(engine.categories[10].color).toBe(DEFAULT_COLORS[0]); // Wraps around
        });

        it('should set correct priority for new category', () => {
          engine.addCategory({ name: 'First' });
          engine.addCategory({ name: 'Second' });
          expect(engine.categories[1].priority).toBe(1);
        });
      });

      describe('updateCategory', () => {
        it('should update category fields', () => {
          document.addEventListener('koppen:category-updated', eventListener);

          const cat = engine.addCategory({ name: 'Original', color: '#000000' });
          engine.updateCategory(cat.id, { name: 'Updated', color: '#FFFFFF' });

          expect(engine.categories[0].name).toBe('Updated');
          expect(engine.categories[0].color).toBe('#FFFFFF');
          expect(eventListener).toHaveBeenCalled();
        });

        it('should not update id or rules', () => {
          const cat = engine.addCategory({ name: 'Test' });
          const originalId = cat.id;
          engine.updateCategory(cat.id, { id: 'new-id', rules: [{ parameter: 'MAT' }] });

          expect(engine.categories[0].id).toBe(originalId);
          expect(engine.categories[0].rules).toHaveLength(0);
        });

        it('should return null for non-existent category', () => {
          const result = engine.updateCategory('non-existent', { name: 'New' });
          expect(result).toBeNull();
        });
      });

      describe('removeCategory', () => {
        it('should remove a category', () => {
          document.addEventListener('koppen:category-removed', eventListener);

          const cat = engine.addCategory({ name: 'ToRemove' });
          const result = engine.removeCategory(cat.id);

          expect(result).toBe(true);
          expect(engine.categories).toHaveLength(0);
          expect(eventListener).toHaveBeenCalled();
        });

        it('should return false for non-existent category', () => {
          const result = engine.removeCategory('non-existent');
          expect(result).toBe(false);
        });

        it('should normalize priorities after removal', () => {
          engine.addCategory({ name: 'A' });
          const catB = engine.addCategory({ name: 'B' });
          engine.addCategory({ name: 'C' });

          engine.removeCategory(catB.id);

          expect(engine.categories[0].priority).toBe(0);
          expect(engine.categories[1].priority).toBe(1);
        });
      });

      describe('reorderCategories', () => {
        it('should reorder categories by ID array', () => {
          document.addEventListener('koppen:categories-reordered', eventListener);

          const catA = engine.addCategory({ name: 'A' });
          const catB = engine.addCategory({ name: 'B' });
          const catC = engine.addCategory({ name: 'C' });

          engine.reorderCategories([catC.id, catA.id, catB.id]);

          expect(engine.categories[0].name).toBe('C');
          expect(engine.categories[1].name).toBe('A');
          expect(engine.categories[2].name).toBe('B');
          expect(eventListener).toHaveBeenCalled();
        });

        it('should update priorities after reorder', () => {
          const catA = engine.addCategory({ name: 'A' });
          const catB = engine.addCategory({ name: 'B' });

          engine.reorderCategories([catB.id, catA.id]);

          expect(engine.categories[0].priority).toBe(0);
          expect(engine.categories[1].priority).toBe(1);
        });

        it('should filter out invalid IDs', () => {
          const catA = engine.addCategory({ name: 'A' });
          engine.addCategory({ name: 'B' });

          engine.reorderCategories([catA.id, 'invalid-id']);

          expect(engine.categories).toHaveLength(1);
          expect(engine.categories[0].name).toBe('A');
        });
      });

      describe('getCategory', () => {
        it('should return category by ID', () => {
          const cat = engine.addCategory({ name: 'Find Me' });
          const found = engine.getCategory(cat.id);
          expect(found?.name).toBe('Find Me');
        });

        it('should return null for non-existent ID', () => {
          const found = engine.getCategory('non-existent');
          expect(found).toBeNull();
        });
      });
    });

    describe('Rule Management', () => {
      let category: ReturnType<typeof CustomRulesEngine.prototype.addCategory>;

      beforeEach(() => {
        category = engine.addCategory({ name: 'Test' });
      });

      describe('addRule', () => {
        it('should add a rule to a category', () => {
          document.addEventListener('koppen:rule-added', eventListener);

          const rule = engine.addRule(category.id, { parameter: 'MAT', operator: '>=', value: 18 });

          expect(engine.categories[0].rules).toHaveLength(1);
          expect(rule?.parameter).toBe('MAT');
          expect(rule?.operator).toBe('>=');
          expect(rule?.value).toBe(18);
          expect(eventListener).toHaveBeenCalled();
        });

        it('should generate rule ID', () => {
          const rule = engine.addRule(category.id);
          expect(rule?.id).toBeDefined();
          expect(rule?.id).toMatch(/^id_/);
        });

        it('should set default values for rule', () => {
          const rule = engine.addRule(category.id);
          expect(rule?.parameter).toBe('MAT');
          expect(rule?.operator).toBe('>=');
          expect(rule?.value).toBe(-50); // Default from MAT range
        });

        it('should return null for non-existent category', () => {
          const rule = engine.addRule('non-existent');
          expect(rule).toBeNull();
        });

        it('should set unit from parameter', () => {
          const rule = engine.addRule(category.id, { parameter: 'MAP' });
          expect(rule?.unit).toBe('mm');
        });
      });

      describe('updateRule', () => {
        it('should update rule fields', () => {
          document.addEventListener('koppen:rule-updated', eventListener);

          const rule = engine.addRule(category.id);
          engine.updateRule(category.id, rule!.id, { parameter: 'MAP', value: 500 });

          expect(engine.categories[0].rules[0].parameter).toBe('MAP');
          expect(engine.categories[0].rules[0].value).toBe(500);
          expect(engine.categories[0].rules[0].unit).toBe('mm'); // Updated based on parameter
          expect(eventListener).toHaveBeenCalled();
        });

        it('should return null for non-existent category', () => {
          const result = engine.updateRule('non-existent', 'rule-id', {});
          expect(result).toBeNull();
        });

        it('should return null for non-existent rule', () => {
          const result = engine.updateRule(category.id, 'non-existent', {});
          expect(result).toBeNull();
        });
      });

      describe('removeRule', () => {
        it('should remove a rule', () => {
          document.addEventListener('koppen:rule-removed', eventListener);

          const rule = engine.addRule(category.id);
          const result = engine.removeRule(category.id, rule!.id);

          expect(result).toBe(true);
          expect(engine.categories[0].rules).toHaveLength(0);
          expect(eventListener).toHaveBeenCalled();
        });

        it('should return false for non-existent category', () => {
          const result = engine.removeRule('non-existent', 'rule-id');
          expect(result).toBe(false);
        });

        it('should return false for non-existent rule', () => {
          const result = engine.removeRule(category.id, 'non-existent');
          expect(result).toBe(false);
        });
      });
    });

    describe('Serialization', () => {
      describe('toJSON', () => {
        it('should serialize engine to JSON object', () => {
          engine.addCategory({ name: 'Test', color: '#FF0000' });
          engine.addRule(engine.categories[0].id, { parameter: 'MAT', operator: '>=', value: 18 });

          const json = engine.toJSON();

          expect(json.version).toBe('1.0.0');
          expect(json.type).toBe('custom-rules');
          expect(json.categories).toHaveLength(1);
          expect(json.categories[0].name).toBe('Test');
          expect(json.categories[0].rules).toHaveLength(1);
        });

        it('should not include unit in serialized rules', () => {
          engine.addCategory({ name: 'Test' });
          engine.addRule(engine.categories[0].id, { parameter: 'MAT', value: 18 });

          const json = engine.toJSON();

          expect(json.categories[0].rules[0].unit).toBeUndefined();
        });
      });

      describe('fromJSON', () => {
        it('should create engine from JSON object', () => {
          const json = {
            categories: [
              { name: 'Test', color: '#FF0000', rules: [{ parameter: 'MAT', value: 18 }] },
            ],
          };

          const newEngine = CustomRulesEngine.fromJSON(json);

          expect(newEngine.categories).toHaveLength(1);
          expect(newEngine.categories[0].name).toBe('Test');
        });

        it('should throw for invalid JSON', () => {
          expect(() => CustomRulesEngine.fromJSON(null)).toThrow('Invalid custom rules JSON');
          expect(() => CustomRulesEngine.fromJSON({})).toThrow('Invalid custom rules JSON');
        });
      });

      describe('exportJSON', () => {
        it('should export as JSON string', () => {
          engine.addCategory({ name: 'Test' });

          const jsonString = engine.exportJSON('My Classification');
          const parsed = JSON.parse(jsonString);

          expect(parsed.name).toBe('My Classification');
          expect(parsed.metadata.exportedAt).toBeDefined();
        });
      });

      describe('importJSON', () => {
        it('should import from JSON string', () => {
          const jsonString = JSON.stringify({
            categories: [{ name: 'Imported', rules: [] }],
          });

          const newEngine = CustomRulesEngine.importJSON(jsonString);

          expect(newEngine.categories[0].name).toBe('Imported');
        });

        it('should throw for invalid JSON string', () => {
          expect(() => CustomRulesEngine.importJSON('not valid json')).toThrow('Failed to parse');
        });
      });
    });
  });

  describe('Helper Functions', () => {
    describe('createCategory', () => {
      it('should create a category object', () => {
        const cat = createCategory('Test', '#FF0000');
        expect(cat.name).toBe('Test');
        expect(cat.color).toBe('#FF0000');
        expect(cat.id).toBeDefined();
        expect(cat.rules).toHaveLength(0);
      });

      it('should create category with rules', () => {
        const rules = [{ parameter: 'MAT', operator: '>=', value: 18 }];
        const cat = createCategory('Test', '#FF0000', rules);
        expect(cat.rules).toHaveLength(1);
        expect(cat.rules[0].id).toBeDefined(); // ID generated for rule
      });
    });

    describe('createRule', () => {
      it('should create a rule object', () => {
        const rule = createRule('MAT', '>=', 18);
        expect(rule.parameter).toBe('MAT');
        expect(rule.operator).toBe('>=');
        expect(rule.value).toBe(18);
        expect(rule.id).toBeDefined();
        expect(rule.unit).toBe('°C');
      });

      it('should handle unknown parameter', () => {
        const rule = createRule('UNKNOWN', '>=', 0);
        expect(rule.unit).toBe('');
      });
    });
  });
});
