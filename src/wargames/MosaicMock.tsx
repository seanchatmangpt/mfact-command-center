import React from 'react';

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
  useLiveQuery: () => ({ data: [] }),
  useRpc: () => ({ call: () => {}, data: null }),
  useEdgeFunction: () => ({ call: () => {}, data: null, pending: false })
};
