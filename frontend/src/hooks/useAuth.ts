import { useCallback, useEffect, useState } from "react";
import { getSession, setUnauthorizedHandler } from "../lib/api";

interface AuthState {
    loading: boolean;
    authRequired: boolean;
    authenticated: boolean;
}

/**
 * 세션 상태를 조회하고 401 발생 시 로그인 화면으로 떨어뜨린다.
 * 네트워크 오류는 잠그지 않는다(서버 게이트가 최종 방어선이며, 연결 배너가 처리).
 */
export function useAuth() {
    const [state, setState] = useState<AuthState>({
        loading: true,
        authRequired: false,
        authenticated: false,
    });

    const check = useCallback(async () => {
        try {
            const info = await getSession();
            setState({
                loading: false,
                authRequired: info.authRequired,
                authenticated: info.authenticated,
            });
        } catch {
            setState({ loading: false, authRequired: false, authenticated: true });
        }
    }, []);

    useEffect(() => {
        void check();
    }, [check]);

    useEffect(() => {
        setUnauthorizedHandler(() =>
            setState((prev) => ({ ...prev, authRequired: true, authenticated: false }))
        );
        return () => setUnauthorizedHandler(null);
    }, []);

    return { ...state, refresh: check };
}
