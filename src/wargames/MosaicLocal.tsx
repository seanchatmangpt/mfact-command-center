import React from 'react';
import { faker } from '@faker-js/faker';

// MOCKED: Explicitly stating that this uses mock generation logic.
faker.seed(12345); // Deterministic PRNG

(window as any).React = React;

(window as any).MosaicNative = {
  View: (props: any) => <div {...props} style={{ display: 'flex', flexDirection: 'column', ...props.style }} />,
  Text: (props: any) => <span {...props} />,
  Pressable: (props: any) => <button {...props} onClick={props.onPress} />,
  ScrollView: (props: any) => <div {...props} style={{ overflow: 'auto', ...props.style }} />,
  FlatList: ({ data, renderItem, style, contentContainerStyle }: any) => (
    <div style={{ overflow: 'auto', ...style, ...contentContainerStyle }}>
      {(data || []).map((item: any, i: number) => (
        <React.Fragment key={i}>{renderItem({ item })}</React.Fragment>
      ))}
    </div>
  ),
  ActivityIndicator: () => <div>[LOADING]</div>,
  StyleSheet: { create: (s: any) => s },
  TextInput: (props: any) => <input {...props} />,
  Switch: (props: any) => <input type="checkbox" {...props} />
};

(window as any).MosaicData = {
  SupabaseProvider: ({ children }: any) => <>{children}</>,
  useAuth: () => ({ user: { id: 1 } }),
  useLiveQuery: (table: string) => {
    // Generates non-empty arrays using faker based on table
    const count = 5;
    let data = [];
    if (table === 'loads') {
      data = Array.from({ length: count }, () => ({
        id: faker.string.uuid(), ref: faker.string.alphanumeric(6).toUpperCase(), status: 'available', equipment: faker.helpers.arrayElement(['reefer', 'dry_van', 'flatbed']),
        origin: faker.location.city(), dest: faker.location.city(), miles: faker.number.int({min:100, max:2000}), rate: faker.number.int({min:500, max:5000}), rpm: faker.number.float({min:1.5, max:4}),
        commodity: faker.commerce.product(), broker: faker.company.name()
      }));
    } else if (table === 'runs') {
      data = Array.from({ length: count }, () => ({
        id: faker.string.uuid(), status: 'rolling', driver_id: faker.string.uuid(), load_ref: faker.string.alphanumeric(6), next_stop: faker.location.city(), progress: faker.number.int({min:10, max:90}),
        miles_remaining: faker.number.int({min:50, max:500}), truck_id: 'TRK-' + faker.number.int({min:100, max:999})
      }));
    } else if (table === 'drivers') {
      data = Array.from({ length: count }, () => ({
        id: faker.string.uuid(), name: faker.person.fullName(), status: faker.helpers.arrayElement(['driving', 'off_duty']), hos_remaining: faker.number.int({min:60, max:600}), rating: faker.number.float({min:3.5, max:5}),
        loads_done: faker.number.int({min:10, max:200}), truck_id: 'TRK-' + faker.number.int({min:100, max:999}), home_terminal: faker.location.city()
      }));
    } else if (table === 'settlements') {
      data = Array.from({ length: count }, () => ({
        id: faker.string.uuid(), period: 'Week ' + faker.number.int({min:1, max:52}), status: 'paid', miles: faker.number.int({min:1000, max:3000}), gross: faker.number.int({min:2000, max:6000}), net: faker.number.int({min:1500, max:4000})
      }));
    } else if (table === 'trucks') {
      data = Array.from({ length: count }, () => ({
        id: 'TRK-' + faker.number.int({min:100, max:999}), status: faker.helpers.arrayElement(['active', 'maintenance']), make: 'Volvo', model: 'VNL', year: faker.number.int({min:2018, max:2024}), odometer: faker.number.int({min:10000, max:500000})
      }));
    } else if (table === 'agents') {
      data = Array.from({ length: count }, () => ({
        id: faker.string.uuid(), name: faker.person.firstName(), status: 'active', protocol: 'MCP', role: 'Dispatcher', model: 'GPT-4', actions: faker.number.int({min:1000, max:10000})
      }));
    } else {
      data = Array.from({ length: count }, () => ({ id: faker.string.uuid(), name: faker.person.fullName(), status: faker.helpers.arrayElement(['active', 'idle']) }));
    }
    return { data };
  },
  useRpc: () => ({ call: () => {}, data: null }),
  useEdgeFunction: () => ({ call: () => {}, data: null, pending: false })
};
