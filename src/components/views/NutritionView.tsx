/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Utensils,
  Flame,
  CheckCircle2,
  Download,
  Plus,
  Clock,
  Apple,
  Sparkles,
  ShoppingBag,
  Check,
} from 'lucide-react';
import { MealItem, RecipeItem, ScreenId } from '../../types';
import { initialMeals, initialRecipes } from '../../data/initialData';
import { ScrollReveal, StaggerContainer, StaggerItem } from '../common/ScrollReveal';
import { useApp } from '../../context/AppContext';
import nutritionImg from '../../assets/images/nutrition_fuel_meal_1791848599914.jpg';

interface NutritionViewProps {
  onNavigate: (screen: ScreenId) => void;
}

export const NutritionView: React.FC<NutritionViewProps> = ({ onNavigate }) => {
  const { language, t } = useApp();
  const [meals, setMeals] = useState<MealItem[]>(initialMeals);
  const [recipes] = useState<RecipeItem[]>(initialRecipes);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Grocery checklist state
  const rawGroceryItems = [
    {
      id: 1,
      nameEs: 'Pechuga de pollo de corral (1.5 kg)',
      nameEn: 'Free-range chicken breast (1.5 kg)',
      catEs: 'Proteínas',
      catEn: 'Proteins',
      checked: true,
    },
    {
      id: 2,
      nameEs: 'Huevos camperos (24 unidades)',
      nameEn: 'Free-range eggs (24 units)',
      catEs: 'Proteínas',
      catEn: 'Proteins',
      checked: true,
    },
    {
      id: 3,
      nameEs: 'Salmón fresco salvaje (600 g)',
      nameEn: 'Fresh wild salmon (600 g)',
      catEs: 'Proteínas',
      catEn: 'Proteins',
      checked: false,
    },
    {
      id: 4,
      nameEs: 'Arroz basmati integral (1 kg)',
      nameEn: 'Brown basmati rice (1 kg)',
      catEs: 'Carbohidratos',
      catEn: 'Carbohydrates',
      checked: true,
    },
    {
      id: 5,
      nameEs: 'Avena en copos suaves (1 kg)',
      nameEn: 'Rolled oats (1 kg)',
      catEs: 'Carbohidratos',
      catEn: 'Carbohydrates',
      checked: false,
    },
    {
      id: 6,
      nameEs: 'Boniatos / Batatas (1 kg)',
      nameEn: 'Sweet potatoes (1 kg)',
      catEs: 'Carbohidratos',
      catEn: 'Carbohydrates',
      checked: false,
    },
    {
      id: 7,
      nameEs: 'Aceite de oliva virgen extra',
      nameEn: 'Extra virgin olive oil',
      catEs: 'Grasas',
      catEn: 'Healthy Fats',
      checked: true,
    },
    {
      id: 8,
      nameEs: 'Aguacates Hass (4 unidades)',
      nameEn: 'Hass avocados (4 units)',
      catEs: 'Grasas',
      catEn: 'Healthy Fats',
      checked: false,
    },
    {
      id: 9,
      nameEs: 'Arándanos y espinacas frescas',
      nameEn: 'Blueberries & fresh spinach',
      catEs: 'Micronutrientes',
      catEn: 'Micronutrients',
      checked: false,
    },
  ];

  const [checkedMap, setCheckedMap] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    4: true,
    7: true,
  });

  const targetCalories = 2800;
  const consumedCalories = meals
    .filter((m) => m.completed)
    .reduce((acc, m) => acc + m.calories, 0);
  const remainingCalories = targetCalories - consumedCalories;

  const totalProtein = meals
    .filter((m) => m.completed)
    .reduce((acc, m) => acc + m.proteinGrams, 0);
  const targetProtein = 180;

  const totalCarbs = meals
    .filter((m) => m.completed)
    .reduce((acc, m) => acc + m.carbsGrams, 0);
  const targetCarbs = 300;

  const totalFat = meals
    .filter((m) => m.completed)
    .reduce((acc, m) => acc + m.fatGrams, 0);
  const targetFat = 80;

  const toggleMealComplete = (id: string) => {
    setMeals(
      meals.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  const toggleGroceryItem = (id: number) => {
    setCheckedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExportList = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const translateMealTime = (time: string) => {
    if (language !== 'en') return time;
    switch (time.toLowerCase()) {
      case 'desayuno':
        return 'Breakfast';
      case 'almuerzo':
        return 'Lunch';
      case 'merienda':
      case 'snack':
        return 'Snack';
      case 'cena':
        return 'Dinner';
      case 'pre-entreno':
        return 'Pre-Workout';
      case 'post-entreno':
        return 'Post-Workout';
      default:
        return time;
    }
  };

  const translateMealName = (name: string) => {
    if (language !== 'en') return name;
    if (name.includes('Avena proteica')) return 'Protein Oatmeal with Berries & Chia';
    if (name.includes('Pechuga de pollo')) return 'Grilled Chicken Breast with Brown Rice & Broccoli';
    if (name.includes('Batido Whey')) return 'Whey Isolate Shake with Banana & Peanut Butter';
    if (name.includes('Salmón a la plancha')) return 'Seared Salmon with Sweet Potatoes & Asparagus';
    return name;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto text-left">
      {/* Header */}
      <ScrollReveal direction="down" duration={0.4}>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#56A867]/15 text-[#56A867] text-[11px] font-mono font-bold uppercase tracking-wider mb-1">
            <Utensils className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Metabolism & Precision Nutrition' : 'Metabolismo & Nutrición de Precisión'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            {language === 'en' ? 'Nutrition Summary & Macros' : 'Resumen Nutricional & Macros'}
          </h1>
          <p className="text-xs sm:text-sm text-[#8E8E9E]">
            {language === 'en'
              ? 'Caloric balance tracking and glycogen replenishment for hypertrophy sessions.'
              : 'Monitoreo de balance calórico, sincronización de glucógeno para la sesión de hipertrofia.'}
          </p>
        </div>
      </ScrollReveal>

      {/* Top Nutrition Stats Grid */}
      <ScrollReveal direction="up" delay={0.1} duration={0.4}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left 5 cols: Calories Donut & Goal */}
          <div className="md:col-span-5 p-6 rounded-2xl bg-[#121218] border border-[#20202A] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#20202C]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#56A867]"
                  strokeDasharray={`${(consumedCalories / targetCalories) * 100}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center flex flex-col items-center">
                <span className="text-xs font-mono text-[#808090]">
                  {language === 'en' ? 'Consumed' : 'Consumido'}
                </span>
                <span className="text-xl font-mono font-extrabold text-white">
                  {consumedCalories}
                </span>
                <span className="text-[10px] text-[#56A867] font-mono">kcal</span>
              </div>
            </div>

            <div className="space-y-2 text-left flex-1">
              <div>
                <span className="text-xs font-mono text-[#808090] uppercase">
                  {language === 'en' ? 'Daily Target' : 'Meta Diaria'}
                </span>
                <div className="text-2xl font-bold font-mono text-white">
                  {targetCalories} kcal
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#181822] border border-[#242432]">
                <span className="text-[11px] text-[#A0A0B0] block">
                  {language === 'en' ? 'Remaining today:' : 'Restante para hoy:'}
                </span>
                <span className="text-sm font-mono font-bold text-[#56A867]">
                  {remainingCalories} kcal
                </span>
              </div>
            </div>
          </div>

          {/* Right 7 cols: Macronutrient Progress Bars */}
          <div className="md:col-span-7 p-6 rounded-2xl bg-[#121218] border border-[#20202A] space-y-4 flex flex-col justify-center">
            <h3 className="text-sm font-serif font-bold text-white">
              {language === 'en' ? 'Macronutrient Distribution' : 'Distribución de Macronutrientes'}
            </h3>

            {/* Protein */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white font-semibold">
                  {language === 'en' ? 'Protein (2.2g / kg)' : 'Proteína (2.2g / kg)'}
                </span>
                <span className="text-[#56A867]">
                  {totalProtein}g / {targetProtein}g ({Math.round((totalProtein / targetProtein) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1C1C26] overflow-hidden">
                <div
                  style={{ width: `${(totalProtein / targetProtein) * 100}%` }}
                  className="h-full rounded-full bg-[#56A867]"
                />
              </div>
            </div>

            {/* Carbs */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white font-semibold">
                  {language === 'en' ? 'Carbohydrates (Glycogen Fuel)' : 'Carbohidratos (Combustible Glucógeno)'}
                </span>
                <span className="text-[#64B875]">
                  {totalCarbs}g / {targetCarbs}g ({Math.round((totalCarbs / targetCarbs) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1C1C26] overflow-hidden">
                <div
                  style={{ width: `${(totalCarbs / targetCarbs) * 100}%` }}
                  className="h-full rounded-full bg-[#64B875]"
                />
              </div>
            </div>

            {/* Fats */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-white font-semibold">
                  {language === 'en' ? 'Healthy Fats (Hormonal Balance)' : 'Grasas Saludables (Hormonal)'}
                </span>
                <span className="text-[#56A867]">
                  {totalFat}g / {targetFat}g ({Math.round((totalFat / targetFat) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1C1C26] overflow-hidden">
                <div
                  style={{ width: `${(totalFat / targetFat) * 100}%` }}
                  className="h-full rounded-full bg-[#56A867]"
                />
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Meal Timeline */}
      <ScrollReveal direction="up" delay={0.15} duration={0.4}>
        <div className="p-6 rounded-2xl bg-[#121218] border border-[#20202A] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E1E28]">
            <h2 className="text-base font-serif font-bold text-white">
              {language === 'en' ? 'Scheduled Meal Times' : 'Tiempos de Comida Programados'}
            </h2>
            <span className="text-xs font-mono text-[#56A867]">
              {meals.filter((m) => m.completed).length} {language === 'en' ? `of ${meals.length} logged` : `de ${meals.length} ingeridas`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                  meal.completed
                    ? 'bg-[#15171B] border-[#2A3F1E]'
                    : 'bg-[#14141C] border-[#22222E]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#56A867] font-bold uppercase">{translateMealTime(meal.mealTime)}</span>
                    <span className="text-[#707080]">{meal.time}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white leading-snug line-clamp-2">
                    {translateMealName(meal.name)}
                  </h4>
                  <div className="text-[10px] font-mono text-[#9E9EA8] pt-1">
                    {meal.calories} kcal • P:{meal.proteinGrams}g • C:{meal.carbsGrams}g • {language === 'en' ? 'F' : 'G'}:{meal.fatGrams}g
                  </div>
                </div>

                <button
                  onClick={() => toggleMealComplete(meal.id)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    meal.completed
                      ? 'bg-[#56A867]/15 text-[#56A867] border border-[#56A867]/30'
                      : 'bg-[#1E1E28] hover:bg-[#56A867] hover:text-black text-[#A0A0B0]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {meal.completed
                      ? (language === 'en' ? 'Completed' : 'Completado')
                      : (language === 'en' ? 'Log Meal' : 'Registrar Ingesta')}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* 2-Column: Recommended Athlete Recipes & Grocery List */}
      <ScrollReveal direction="up" delay={0.2} duration={0.4}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 6 cols: Recipes */}
          <div className="lg:col-span-6 p-6 rounded-2xl bg-[#121218] border border-[#20202A] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1E1E28]">
              <h3 className="text-base font-serif font-bold text-white">
                {language === 'en' ? 'High-Performance Recipes' : 'Recetas de Alto Rendimiento'}
              </h3>
              <span className="text-xs font-mono text-[#808090]">
                {language === 'en' ? 'AI Optimized' : 'Calculadas con IA'}
              </span>
            </div>

            <div className="space-y-3">
              {recipes.map((rec) => {
                const title = language === 'en'
                  ? (rec.title.includes('Bowl de Salmón') ? 'Quinoa & Salmon Recovery Bowl' : rec.title.includes('Tortitas') ? 'Oat & Egg White Protein Pancakes' : rec.title)
                  : rec.title;
                const desc = language === 'en'
                  ? (rec.description.includes('Rico en Omega-3') ? 'High in Omega-3 and complex carbs, ideal post-training.' : rec.description.includes('Desayuno energético') ? 'Energetic breakfast with high biological value protein.' : rec.description)
                  : rec.description;

                return (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-xl bg-[#15151F] border border-[#242432] flex gap-3.5 items-center hover:border-[#56A867]/40 transition-all"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-[#1A1A26] border border-[#262638]">
                      <img
                        src={rec.image || nutritionImg}
                        alt={title}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== nutritionImg) {
                            target.src = nutritionImg;
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-serif">{title}</span>
                        <span className="text-[10px] text-[#56A867] font-mono">{rec.prepTimeMinutes} min</span>
                      </div>
                      <p className="text-[11px] text-[#8E8E9E] line-clamp-1">{desc}</p>
                      <div className="flex gap-2 text-[10px] font-mono text-[#A0A0B0] pt-1">
                        <span className="px-1.5 py-0.5 rounded bg-[#1E1E2A] text-white">
                          {language === 'en' ? 'Pro' : 'Pro'}: {rec.proteinGrams}g
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#1E1E2A] text-white">
                          {language === 'en' ? 'Carb' : 'Carb'}: {rec.carbsGrams}g
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#1E1E2A] text-white">
                          {language === 'en' ? 'Fat' : 'Grasa'}: {rec.fatGrams}g
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 6 cols: Generated Grocery Checklist */}
          <div className="lg:col-span-6 p-6 rounded-2xl bg-[#121218] border border-[#20202A] space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E1E28]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#56A867]" />
                  <h3 className="text-base font-serif font-bold text-white">
                    {language === 'en' ? 'Generated Grocery List' : 'Lista de Compras Generada'}
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#56A867]">
                  {language === 'en' ? 'Week 4' : 'Semana 4'}
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {rawGroceryItems.map((item) => {
                  const isChecked = !!checkedMap[item.id];
                  const itemName = language === 'en' ? item.nameEn : item.nameEs;
                  const itemCat = language === 'en' ? item.catEn : item.catEs;

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleGroceryItem(item.id)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-[#15181D] border-[#293B1E] text-[#808090] line-through'
                          : 'bg-[#161620] border-[#22222E] text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isChecked
                              ? 'bg-[#56A867] border-[#56A867] text-black'
                              : 'border-[#404052]'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span>{itemName}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#606070]">{itemCat}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              {downloadSuccess && (
                <div className="mb-2 p-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-mono text-center">
                  ✓ {language === 'en' ? 'Nutritional grocery list exported as PDF.' : 'Lista de compras nutricional exportada en PDF.'}
                </div>
              )}
              <button
                onClick={handleExportList}
                className="w-full py-3 px-4 rounded-xl bg-[#56A867] hover:bg-[#64B875] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(86,168,103,0.25)] flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'en' ? 'Export PDF / Download Grocery List' : 'Exportar PDF / Descargar Lista'}</span>
              </button>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};
