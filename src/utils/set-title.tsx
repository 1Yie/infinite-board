import { useEffect } from 'react';

interface SetTitleProps {
	title: string;
}

export function SetTitle({ title }: SetTitleProps) {
	useEffect(() => {
		document.title = title;
	}, [title]);

	return null;
}
