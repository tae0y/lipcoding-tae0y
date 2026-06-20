import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    error: Error | null;
}

/** 렌더 중 발생한 예외를 가두어 흰 화면 대신 폴백 UI를 보여준다. */
export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("UI crashed:", error, info.componentStack);
    }

    private handleReset = () => this.setState({ error: null });

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div className="mx-auto max-w-[640px] px-4 py-16 text-center space-y-4">
                <h1 className="text-lg font-semibold text-neutral-900">
                    문제가 발생했어요
                </h1>
                <p className="text-sm text-neutral-500">
                    화면을 그리는 중 오류가 났지만, 입력한 내용은 서버에 남아 있어요.
                </p>
                <div className="flex justify-center gap-2">
                    <button
                        type="button"
                        onClick={this.handleReset}
                        className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                        다시 시도
                    </button>
                    <button
                        type="button"
                        onClick={() => location.reload()}
                        className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50"
                    >
                        새로고침
                    </button>
                </div>
            </div>
        );
    }
}
