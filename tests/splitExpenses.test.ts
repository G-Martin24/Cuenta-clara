import {
  calculateSplitBreakdown,
  cleanAccountSplitData,
  getSplitBadgeText,
} from '../src/utils/splitExpenses';
import { Account } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

function assertCloseTo(actual: number, expected: number, tolerance = 0.0001, message: string) {
  if (Math.abs(actual - expected) > tolerance) {
    console.error(`❌ FAILED: ${message}. Expected ${expected}, got ${actual}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('====================================================');
console.log('🧪 EJECUTANDO PRUEBAS DE DESGLOSE DE GASTOS COMPARTIDOS');
console.log('====================================================\n');

// -----------------------------------------------------------------------------
// PRUEBA 1: Dividir un servicio entre 3 personas en partes iguales
// -----------------------------------------------------------------------------
console.log('--- PRUEBA 1: Dividir un servicio entre 3 personas en partes iguales ---');

{
  const total = 31053.00;
  const breakdown = calculateSplitBreakdown(total, true, 3, 'equal');

  assert(breakdown.peopleCount === 3, 'Cantidad de personas debe ser 3');
  assert(breakdown.isEqual === true, 'El tipo de división debe ser igualitaria');
  assert(breakdown.shares.length === 3, 'Debe haber exactamente 3 partes calculadas');

  // Cada persona debe pagar exactamente 10.351,00
  assertCloseTo(breakdown.shares[0], 10351.00, 0.001, 'Persona 1 (usuario actual) paga exactamente 10.351,00');
  assertCloseTo(breakdown.shares[1], 10351.00, 0.001, 'Persona 2 paga exactamente 10.351,00');
  assertCloseTo(breakdown.shares[2], 10351.00, 0.001, 'Persona 3 paga exactamente 10.351,00');

  // El usuario actual NO debe tener una diferencia de 33% vs 33.5%
  assert(
    breakdown.shares[0] === breakdown.shares[1] && breakdown.shares[1] === breakdown.shares[2],
    'Las tres partes son exactamente idénticas sin porcentajes arbitrarios como 33% vs 33,5%'
  );

  assertCloseTo(breakdown.myShareAmount, 10351.00, 0.001, 'myShareAmount es 10.351,00');
  assertCloseTo(breakdown.othersShareAmount, 20702.00, 0.001, 'othersShareAmount es 20.702,00');

  const sumShares = breakdown.shares.reduce((acc, val) => acc + val, 0);
  assertCloseTo(sumShares, total, 0.001, 'La suma de las 3 partes coincide exactamente con el total de 31.053,00');

  // Caso con centavos que requieren redondeo (ej. 100 entre 3)
  const breakdownOdd = calculateSplitBreakdown(100.00, true, 3, 'equal');
  const sumOdd = breakdownOdd.shares.reduce((acc, val) => acc + val, 0);
  assertCloseTo(sumOdd, 100.00, 0.001, 'División de 100 entre 3: suma de partes es exactamente 100,00');
  assert(
    breakdownOdd.shares.every((s) => s === 33.33 || s === 33.34),
    'División de 100 entre 3: los montos difieren sólo en centavos por redondeo (33,34 y 33,33)'
  );
}

// -----------------------------------------------------------------------------
// PRUEBA 2: Cambiar Municipalidad de individual a dividido entre 2
// -----------------------------------------------------------------------------
console.log('\n--- PRUEBA 2: Cambiar Municipalidad de individual a dividido entre 2 ---');

{
  const initialAccount: Account = {
    id: 'acc-muni-123',
    userId: 'user-test',
    name: 'Municipalidad',
    category: 'Impuestos',
    amount: 15400,
    amountType: 'fixed',
    currency: 'ARS',
    frequency: 'monthly',
    status: 'active',
    isShared: false,
    splitTotalPeople: 1,
    mySharePercentage: 100,
    splitNotes: '',
    sharedWith: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Verificación estado individual
  assert(initialAccount.isShared === false, 'Municipalidad inicia como servicio individual');
  const initialBreakdown = calculateSplitBreakdown(
    initialAccount.amount,
    initialAccount.isShared,
    initialAccount.splitTotalPeople,
    'equal',
    initialAccount.mySharePercentage
  );
  assertCloseTo(initialBreakdown.myShareAmount, 15400, 0.001, 'Monto propio en individual es el 100% (15.400)');
  assert(initialBreakdown.othersShareAmount === 0, 'En individual la parte de terceros es 0');

  // Modificación a dividido entre 2 personas
  const editPayload: Partial<Account> = {
    isShared: true,
    splitType: 'equal',
    splitTotalPeople: 2,
    splitNotes: 'Con mi pareja',
  };

  const updatedAccount = cleanAccountSplitData({
    ...initialAccount,
    ...editPayload,
  });

  assert(updatedAccount.isShared === true, 'isShared se actualizó correctamente a true');
  assert(updatedAccount.splitType === 'equal', 'splitType es equal');
  assert(updatedAccount.splitTotalPeople === 2, 'splitTotalPeople se actualizó a 2');
  assert(updatedAccount.mySharePercentage === 50, 'mySharePercentage se normalizó automáticamente a 50%');
  assert(updatedAccount.sharedWith === 'Con mi pareja', 'sharedWith se actualizó correctamente');

  const updatedBreakdown = calculateSplitBreakdown(
    updatedAccount.amount,
    updatedAccount.isShared,
    updatedAccount.splitTotalPeople,
    updatedAccount.splitType,
    updatedAccount.mySharePercentage
  );

  assertCloseTo(updatedBreakdown.myShareAmount, 7700.00, 0.001, 'Monto propio actualizado a 7.700,00 (50%)');
  assertCloseTo(updatedBreakdown.othersShareAmount, 7700.00, 0.001, 'Monto de otros actualizado a 7.700,00');
  assertCloseTo(updatedBreakdown.myShareAmount + updatedBreakdown.othersShareAmount, 15400.00, 0.001, 'Suma da 15.400,00');

  const badgeText = getSplitBadgeText(
    updatedAccount.isShared,
    updatedAccount.splitTotalPeople,
    updatedAccount.mySharePercentage,
    updatedAccount.splitType
  );
  assert(badgeText === 'Dividida 50% c/u', `Badge muestra "Dividida 50% c/u" (obtenido: "${badgeText}")`);
}

// -----------------------------------------------------------------------------
// PRUEBA 3: Cambiar nuevamente la división y comprobar que los montos se actualicen
// -----------------------------------------------------------------------------
console.log('\n--- PRUEBA 3: Cambiar nuevamente la división y comprobar que los montos se actualicen ---');

{
  const accountBase: Account = {
    id: 'acc-muni-123',
    userId: 'user-test',
    name: 'Municipalidad',
    category: 'Impuestos',
    amount: 15400,
    amountType: 'fixed',
    currency: 'ARS',
    frequency: 'monthly',
    status: 'active',
    isShared: true,
    splitType: 'equal',
    splitTotalPeople: 2,
    mySharePercentage: 50,
    splitNotes: 'Con mi pareja',
    sharedWith: 'Con mi pareja',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Cambio 1: Cambiar a dividido entre 4 personas en partes iguales
  const changeTo4 = cleanAccountSplitData({
    ...accountBase,
    splitTotalPeople: 4,
    splitType: 'equal',
  });

  assert(changeTo4.splitTotalPeople === 4, 'Nueva cantidad de personas es 4');
  assert(changeTo4.mySharePercentage === 25, 'Porcentaje actualizado automáticamente a 25%');

  const breakdown4 = calculateSplitBreakdown(
    changeTo4.amount,
    changeTo4.isShared,
    changeTo4.splitTotalPeople,
    changeTo4.splitType,
    changeTo4.mySharePercentage
  );

  assertCloseTo(breakdown4.myShareAmount, 3850.00, 0.001, 'Monto propio para 4 personas es 3.850,00 (15.400 / 4)');
  assertCloseTo(breakdown4.othersShareAmount, 11550.00, 0.001, 'Monto de otros es 11.550,00');
  assertCloseTo(breakdown4.myShareAmount + breakdown4.othersShareAmount, 15400.00, 0.001, 'Suma da 15.400,00');

  // Cambio 2: Cambiar a división personalizada (60% usuario, 40% otros entre 2 personas)
  const changeToCustom = cleanAccountSplitData({
    ...changeTo4,
    splitTotalPeople: 2,
    splitType: 'custom',
    mySharePercentage: 60,
  });

  assert(changeToCustom.splitType === 'custom', 'splitType es custom');
  assert(changeToCustom.mySharePercentage === 60, 'mySharePercentage es 60');

  const breakdownCustom = calculateSplitBreakdown(
    changeToCustom.amount,
    changeToCustom.isShared,
    changeToCustom.splitTotalPeople,
    changeToCustom.splitType,
    changeToCustom.mySharePercentage
  );

  assertCloseTo(breakdownCustom.myShareAmount, 9240.00, 0.001, 'Monto propio al 60% es 9.240,00');
  assertCloseTo(breakdownCustom.othersShareAmount, 6160.00, 0.001, 'Monto de otros al 40% es 6.160,00');
  assertCloseTo(breakdownCustom.myShareAmount + breakdownCustom.othersShareAmount, 15400.00, 0.001, 'Suma da 15.400,00');

  // Cambio 3: Cambiar de nuevo a Individual (limpiando datos obsoletos)
  const changeBackToIndividual = cleanAccountSplitData({
    ...changeToCustom,
    isShared: false,
  });

  assert(changeBackToIndividual.isShared === false, 'isShared es false');
  assert(changeBackToIndividual.splitTotalPeople === 1, 'splitTotalPeople se reseteó a 1');
  assert(changeBackToIndividual.mySharePercentage === 100, 'mySharePercentage se reseteó a 100');
  assert(changeBackToIndividual.splitNotes === '', 'splitNotes se limpió');
  assert(changeBackToIndividual.sharedWith === '', 'sharedWith se limpió');
  assert(Array.isArray(changeBackToIndividual.participants) && changeBackToIndividual.participants.length === 0, 'participants se limpió');

  const breakdownBack = calculateSplitBreakdown(
    changeBackToIndividual.amount,
    changeBackToIndividual.isShared,
    changeBackToIndividual.splitTotalPeople,
    changeBackToIndividual.splitType,
    changeBackToIndividual.mySharePercentage
  );

  assertCloseTo(breakdownBack.myShareAmount, 15400.00, 0.001, 'Al volver a individual, monto propio vuelve a 15.400,00');
  assertCloseTo(breakdownBack.othersShareAmount, 0, 0.001, 'Al volver a individual, otrosShareAmount es 0');
}

// -----------------------------------------------------------------------------
// PRUEBA 4: Confirmar que la suma de las partes siempre sea igual al total
// -----------------------------------------------------------------------------
console.log('\n--- PRUEBA 4: Confirmar que la suma de las partes siempre sea igual al total ---');

{
  const testAmounts = [
    0,
    0.01,
    0.02,
    0.03,
    0.99,
    1.00,
    3.00,
    10.00,
    33.33,
    100.00,
    31053.00,
    12345.67,
    49999.99,
    99999.95,
    150234.89,
    1000000.00,
  ];

  const peopleCounts = [2, 3, 4, 5, 6, 7, 8, 9, 10];

  let iterationsEqual = 0;
  for (const amt of testAmounts) {
    for (const count of peopleCounts) {
      const b = calculateSplitBreakdown(amt, true, count, 'equal');
      const sum = b.shares.reduce((a, c) => a + c, 0);
      assertCloseTo(
        sum,
        b.total,
        0.0001,
        `Equal split: Total ${amt} entre ${count} personas -> Suma ${sum.toFixed(2)} === ${b.total.toFixed(2)}`
      );
      assertCloseTo(
        b.myShareAmount + b.othersShareAmount,
        b.total,
        0.0001,
        `Equal split: myShareAmount + othersShareAmount === total (${amt})`
      );
      iterationsEqual++;
    }
  }
  console.log(`✅ Verificadas ${iterationsEqual} combinaciones de división en partes iguales.`);

  // Test de porcentajes personalizados variados
  const customPercentages = [1, 10, 25, 33.33, 50, 66.67, 75, 90, 99];
  let iterationsCustom = 0;
  for (const amt of [10.00, 100.00, 31053.00, 54321.19]) {
    for (const count of [2, 3, 4, 5]) {
      for (const pct of customPercentages) {
        const b = calculateSplitBreakdown(amt, true, count, 'custom', pct);
        const sum = b.shares.reduce((a, c) => a + c, 0);
        assertCloseTo(
          sum,
          b.total,
          0.0001,
          `Custom split: Total ${amt} entre ${count} (mi pct: ${pct}%) -> Suma ${sum.toFixed(2)} === ${b.total.toFixed(2)}`
        );
        assertCloseTo(
          b.myShareAmount + b.othersShareAmount,
          b.total,
          0.0001,
          `Custom split: myShareAmount + othersShareAmount === total (${amt})`
        );
        iterationsCustom++;
      }
    }
  }
  console.log(`✅ Verificadas ${iterationsCustom} combinaciones de división personalizada.`);
}

console.log('\n====================================================');
console.log('🎉 TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO');
console.log('====================================================');
