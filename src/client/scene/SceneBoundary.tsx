import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  resetKey: number;
  retry: () => void;
  onFailure?: () => void;
  /** A scoped fallback may be null while its presentation is inactive. */
  fallback?: ReactNode;
}

export class SceneBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure?.(); }
  componentDidUpdate(previous: Props) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return <div className="scene-fallback" role="status"><strong>3D 场景暂时无法显示</strong><p>可继续查看小地图和选手信息，并正常操作。</p><button onClick={this.props.retry}>重新载入 3D</button></div>;
  }
}
