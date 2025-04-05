
import React from 'react';

export const AuthFormDivider = () => {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-muted"></div>
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
      </div>
    </div>
  );
};
