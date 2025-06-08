// Comprehensive Resonite enum definitions with actual enum values
export const RESONITE_ENUM_VALUES = {
  // Audio enums
  AudioDistanceModel: ['InverseDistance', 'InverseDistanceClamped', 'Linear', 'LinearClamped', 'Exponent', 'ExponentClamped'],
  AudioRolloffMode: ['Logarithmic', 'Linear', 'Custom'],
  AudioSpeakerMode: ['Raw', 'Mono', 'Stereo', 'Quad', 'Surround', 'Mode5point1', 'Mode7point1', 'Prologic'],
  
  // Blend modes
  BlendMode: ['Opaque', 'Cutout', 'Fade', 'Transparent', 'Additive', 'Soft_Additive', 'Multiply', 'Premultiplied_Alpha'],
  
  // Camera enums
  CameraClearFlags: ['Skybox', 'Color', 'Depth', 'Nothing'],
  CameraType: ['Perspective', 'Orthographic'],
  
  // Collision enums
  CollisionDetectionMode: ['Discrete', 'Continuous', 'ContinuousDynamic', 'ContinuousSpeculative'],
  ColliderType: ['NoCollision', 'Trigger', 'Collider', 'CharacterController'],
  
  // Culling enums
  CullingMode: ['Off', 'Front', 'Back'],
  ZWrite: ['Auto', 'On', 'Off'],
  ZTest: ['Less', 'Greater', 'LEqual', 'GEqual', 'Equal', 'NotEqual', 'Always', 'Never'],
  
  // Input enums
  ButtonEventType: ['Press', 'Release', 'Hover', 'HoverEnter', 'HoverLeave'],
  InputGroup: ['None', 'Keyboard', 'Mouse', 'Gamepad', 'Touch', 'Pen', 'Tracker', 'Eye'],
  Key: ['None', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Alpha0', 'Alpha1', 'Alpha2', 'Alpha3', 'Alpha4', 'Alpha5', 'Alpha6', 'Alpha7', 'Alpha8', 'Alpha9', 'Space', 'Enter', 'Tab', 'Backspace', 'Insert', 'Delete', 'LeftArrow', 'RightArrow', 'UpArrow', 'DownArrow', 'Home', 'End', 'PageUp', 'PageDown'],
  MouseButton: ['None', 'Left', 'Right', 'Middle', 'Forward', 'Back'],
  
  // Light enums
  LightType: ['Spot', 'Directional', 'Point', 'Area'],
  LightmapBakeType: ['Realtime', 'Baked', 'Mixed'],
  LightShadows: ['None', 'Hard', 'Soft'],
  
  // Material enums
  MaterialPropertyType: ['Float', 'Float2', 'Float3', 'Float4', 'Color', 'Texture2D', 'TextureCube', 'Matrix'],
  TextureWrapMode: ['Repeat', 'Clamp', 'Mirror', 'MirrorOnce'],
  FilterMode: ['Point', 'Bilinear', 'Trilinear'],
  
  // Mesh enums
  MeshTopology: ['Triangles', 'Quads', 'Lines', 'LineStrip', 'Points'],
  IndexFormat: ['UInt16', 'UInt32'],
  
  // Physics enums
  RigidbodyConstraints: ['None', 'FreezePositionX', 'FreezePositionY', 'FreezePositionZ', 'FreezeRotationX', 'FreezeRotationY', 'FreezeRotationZ', 'FreezePosition', 'FreezeRotation', 'FreezeAll'],
  ForceMode: ['Force', 'Acceleration', 'Impulse', 'VelocityChange'],
  
  // Rendering enums
  RenderQueue: ['Background', 'Geometry', 'AlphaTest', 'Transparent', 'Overlay'],
  ShadowCastingMode: ['Off', 'On', 'TwoSided', 'ShadowsOnly'],
  
  // Text enums
  TextAlignment: ['Left', 'Center', 'Right', 'Justified'],
  TextAnchor: ['UpperLeft', 'UpperCenter', 'UpperRight', 'MiddleLeft', 'MiddleCenter', 'MiddleRight', 'LowerLeft', 'LowerCenter', 'LowerRight'],
  FontStyle: ['Normal', 'Bold', 'Italic', 'BoldAndItalic'],
  
  // Transform enums
  Space: ['World', 'Self'],
  
  // UI enums
  UIScaleMode: ['ConstantPixelSize', 'ScaleWithScreenSize', 'ConstantPhysicalSize'],
  
  // Video enums
  VideoAspectRatio: ['NoScaling', 'FitWithinParent', 'FitParentCompletely', 'StretchToParent'],
  
  // Locomotion enums
  LocomotionGait: ['Walking', 'Running', 'Sprinting'],
  LocomotionDirection: ['Forward', 'Backward', 'Left', 'Right'],
  
  // Interaction enums
  InteractionElement: ['None', 'Trigger', 'Grip', 'Primary', 'Secondary', 'Menu', 'TouchpadPress', 'TouchpadTouch'],
  
  // Haptic enums
  HapticPattern: ['Click', 'DoubleClick', 'Tick', 'ThudUp', 'ThudDown', 'Pop', 'Drop'],
  
  // Gesture enums
  GestureType: ['None', 'Point', 'Peace', 'RockOn', 'Thumbsup', 'Fist', 'OpenHand', 'Pistol', 'Timeout'],
  
  // Network enums
  NetworkEventType: ['Join', 'Leave', 'Update', 'Sync'],
  
  // Asset enums
  AssetLoadState: ['None', 'Loading', 'Loaded', 'Failed'],
  
  // Animation enums
  AnimationWrapMode: ['Once', 'Loop', 'PingPong', 'Default', 'ClampForever'],
  
  // Procedural enums
  NoiseType: ['Perlin', 'Billow', 'RidgedMultifractal', 'Voronoi', 'Simplex', 'SimplexBillow'],
  FractalType: ['None', 'FBm', 'Billow', 'RidgedMulti'],
  
  // Color space enums
  ColorProfile: ['sRGB', 'Linear', 'Rec2020'],
  ColorModel: ['RGB', 'HSV', 'HSL', 'XYZ', 'Lab'],
  
  // Time enums
  TimeScale: ['Normal', 'Scaled', 'Unscaled', 'Fixed'],
  
  // Quality enums
  QualityLevel: ['VeryLow', 'Low', 'Medium', 'High', 'VeryHigh', 'Ultra'],
  
  // Platform enums
  Platform: ['Desktop', 'Mobile', 'VR', 'AR'],
  
  // Device enums
  DeviceType: ['Unknown', 'Handheld', 'Console', 'Desktop'],
  
  // Session enums
  SessionAccessLevel: ['Private', 'LAN', 'Friends', 'FriendsOfFriends', 'RegisteredUsers', 'Anyone'],
  
  // User enums
  UserStatus: ['Online', 'Away', 'Busy', 'Invisible'],
  
  // World enums
  WorldPreset: ['Grid', 'SpaceWorld', 'Datacenter', 'SkyWorld', 'ContactsWorld'],
  
  // Tool enums
  ToolType: ['LogiX', 'Material', 'Dev', 'Transform', 'Interaction', 'Avatar'],
  
  // Snap enums
  SnapPoint: ['Center', 'Bottom', 'Top', 'Left', 'Right', 'Front', 'Back'],
  
  // Anchor enums
  AnchorMin: ['TopLeft', 'TopCenter', 'TopRight', 'MiddleLeft', 'MiddleCenter', 'MiddleRight', 'BottomLeft', 'BottomCenter', 'BottomRight', 'VerticalStretchLeft', 'VerticalStretchCenter', 'VerticalStretchRight', 'HorizontalStretchTop', 'HorizontalStretchMiddle', 'HorizontalStretchBottom', 'StretchAll']
} as const;

// Type for all available enum categories
export type ResoniteEnumCategory = keyof typeof RESONITE_ENUM_VALUES;

// Helper function to get enum values for a category
export function getEnumValues(category: ResoniteEnumCategory): readonly string[] {
  return RESONITE_ENUM_VALUES[category] || [];
}

// Helper function to get all enum categories
export function getEnumCategories(): ResoniteEnumCategory[] {
  return Object.keys(RESONITE_ENUM_VALUES) as ResoniteEnumCategory[];
}

// Helper function to search enum categories
export function searchEnumCategories(query: string): ResoniteEnumCategory[] {
  const lowerQuery = query.toLowerCase();
  return getEnumCategories().filter(category => 
    category.toLowerCase().includes(lowerQuery)
  );
}

// Helper function to search enum values within a category
export function searchEnumValues(category: ResoniteEnumCategory, query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const values = getEnumValues(category);
  return values.filter(value => 
    value.toLowerCase().includes(lowerQuery)
  );
}