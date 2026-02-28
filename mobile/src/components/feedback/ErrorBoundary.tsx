import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center p-4 bg-gray-50">
          <View className="bg-white rounded-xl p-8 w-full items-center">
            <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
              <AlertTriangle size={32} color="#374151" />
            </View>
            <Text className="text-2xl font-bold mb-2 text-gray-900">予期しないエラーです</Text>
            <Text className="text-base text-gray-600 text-center mb-4">
              アプリケーション実行中にエラーが発生しました。
            </Text>
            {this.state.error && (
              <ScrollView className="mb-4 p-3 bg-gray-100 rounded-lg w-full max-h-24">
                <Text className="text-xs font-mono text-gray-900">{this.state.error.message}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}
